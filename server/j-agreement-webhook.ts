/**
 * j-agreement.com → loverschain.jp Webhook受信エンドポイント
 *
 * エンドポイント: POST /api/webhook/j-agreement
 *
 * j-agreement.comがブロックチェーン記録を確認したとき、このエンドポイントに
 * blockchain.confirmed イベントを送信してくる。
 * HMAC-SHA256署名（X-Loverschain-Signature: sha256={hex}）を検証してから処理する。
 */

import type { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import { partnerships } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ────────────────────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────────────────────

interface BlockchainConfirmedPayload {
  event: "blockchain.confirmed";
  record_id: string;        // jar_xxx
  partnership_id: string;   // "loverschain-{id}"
  tx_hash: string;          // 0xabc...
  block_number: number;
  confirmed_at: string;     // ISO8601
  timestamp: number;
}

interface TestPayload {
  event: "test";
  record_id: string;
  partnership_id: string;
  timestamp: number;
}

type WebhookPayload = BlockchainConfirmedPayload | TestPayload;

// ────────────────────────────────────────────────────────────
// HMAC-SHA256 署名検証
// ────────────────────────────────────────────────────────────

function verifySignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  // ヘッダー形式: "sha256={hex}"
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// Webhook ハンドラー
// ────────────────────────────────────────────────────────────

export async function handleJAgreementWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const secret = process.env.LOVERSCHAIN_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[j-agreement Webhook] LOVERSCHAIN_WEBHOOK_SECRET not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  // 署名検証（raw bodyが必要）
  const sig = req.headers["x-loverschain-signature"] as string | undefined;
  const rawBody: Buffer = req.body; // express.raw() で取得

  if (!verifySignature(rawBody, sig, secret)) {
    console.warn("[j-agreement Webhook] Invalid signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf-8")) as WebhookPayload;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  console.log(
    `[j-agreement Webhook] Event: ${payload.event} | record_id: ${payload.record_id}`
  );

  // ────────────────────────────────────────────────────────
  // テストイベント（疎通確認）
  // ────────────────────────────────────────────────────────
  if (payload.event === "test") {
    console.log("[j-agreement Webhook] Test event received — OK");
    res.json({ received: true, event: "test" });
    return;
  }

  // ────────────────────────────────────────────────────────
  // blockchain.confirmed イベント
  // ────────────────────────────────────────────────────────
  if (payload.event === "blockchain.confirmed") {
    const confirmed = payload as BlockchainConfirmedPayload;

    // partnership_id から数値IDを取得 ("loverschain-{id}" 形式)
    const match = confirmed.partnership_id.match(/^loverschain-(\d+)$/);
    if (!match) {
      console.warn(
        `[j-agreement Webhook] Unexpected partnership_id format: ${confirmed.partnership_id}`
      );
      res.status(400).json({ error: "Invalid partnership_id format" });
      return;
    }
    const partnershipId = parseInt(match[1], 10);

    try {
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }

      await db
        .update(partnerships)
        .set({
          jAgreementRecordId: confirmed.record_id,
          blockchainTxHash: confirmed.tx_hash,
          blockchainBlockNumber: confirmed.block_number,
          blockchainConfirmedAt: new Date(confirmed.confirmed_at),
        })
        .where(eq(partnerships.id, partnershipId));

      console.log(
        `[j-agreement Webhook] Partnership ${partnershipId} confirmed on blockchain` +
          ` | txHash: ${confirmed.tx_hash} | block: ${confirmed.block_number}`
      );

      res.json({ received: true, event: "blockchain.confirmed" });
    } catch (err) {
      console.error("[j-agreement Webhook] DB update error:", err);
      res.status(500).json({ error: "Internal error" });
    }
    return;
  }

  // 未知のイベントは 200 で受け取るだけ（将来の拡張に備える）
  console.log(`[j-agreement Webhook] Unknown event: ${(payload as WebhookPayload).event}`);
  res.json({ received: true });
}
