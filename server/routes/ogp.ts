/**
 * OGP 画像生成 API エンドポイント
 *
 * GET /api/ogp/certificate/:id
 *   - パートナーシップ ID を受け取り、Canvas API で 1200x630 の PNG 画像を動的生成して返す
 *   - SNS クローラー（Twitterbot / facebookexternalhit）は直接この URL を叩く
 *   - 通常ブラウザからのアクセスは /certificate/:id へリダイレクト
 *   - Cache-Control: public, max-age=3600（1時間キャッシュ）
 */

import { Router, Request, Response } from "express";
import { generateOgpImage, getOgpDataForPartnership } from "../ogp";
import { generateKokonomiageCert } from "../certificates/kokonomiage";
import { getPartnershipById, getUserById } from "../db";

const router = Router();

// SNS クローラーの User-Agent パターン
const CRAWLER_UA_PATTERN =
  /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|TelegramBot|Discordbot|WhatsApp|Pinterest|Googlebot|bingbot|Applebot/i;

router.get("/certificate/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid partnership ID" });
    return;
  }

  const ua = req.headers["user-agent"] ?? "";
  const isCrawler = CRAWLER_UA_PATTERN.test(ua);

  // 通常ブラウザはそのまま証明書ページへリダイレクト
  if (!isCrawler && req.query.force !== "1") {
    res.redirect(302, `/certificate/${id}`);
    return;
  }

  try {
    const data = await getOgpDataForPartnership(id);
    if (!data) {
      res.status(404).json({ error: "Partnership not found" });
      return;
    }

    const imageBuffer = await generateOgpImage(data);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(imageBuffer);
  } catch (err) {
    console.error("[OGP] Image generation error:", err);
    res.status(500).json({ error: "Failed to generate OGP image" });
  }
});

/**
 * GET /api/ogp/kokonomiage/:id
 * 婚姻届風証明書画像を生成して返す
 * ?force=1 で通常ブラウザからも直接取得可能
 */
router.get("/kokonomiage/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid partnership ID" });
    return;
  }

  try {
    const partnership = await getPartnershipById(id);
    if (!partnership) {
      res.status(404).json({ error: "Partnership not found" });
      return;
    }

    const [user1, user2] = await Promise.all([
      getUserById(partnership.user1Id),
      getUserById(partnership.user2Id),
    ]);

    if (!user1 || !user2) {
      res.status(404).json({ error: "Users not found" });
      return;
    }

    const imageBuffer = await generateKokonomiageCert({
      user1Name: user1.displayName ?? user1.name ?? "ユーザー1",
      user2Name: user2.displayName ?? user2.name ?? "ユーザー2",
      certId: `KS-${String(partnership.id).padStart(8, "0")}`,
      startedAt: partnership.startedAt,
      planType: partnership.planType,
      blockchainTxHash: partnership.blockchainTxHash,
      blockchainRegisteredAt: partnership.blockchainRegisteredAt,
      issuedAt: new Date(),
      user1AvatarUrl: user1.avatarUrl ?? null,
      user2AvatarUrl: user2.avatarUrl ?? null,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Disposition", `attachment; filename="kokonomiage-${id}.png"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(imageBuffer);
  } catch (err) {
    console.error("[Kokonomiage] Image generation error:", err);
    res.status(500).json({ error: "Failed to generate certificate image" });
  }
});

export default router;
