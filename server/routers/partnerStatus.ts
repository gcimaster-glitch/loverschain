/**
 * パートナーステータス事前確認ルーター
 *
 * シングル/イエロー/レッド判定機能:
 * - シングル: パートナーなし（新規交際可能）
 * - イエロー: 90日以内に解消完了（※付きで交際可能）
 * - レッド: 現在交際中（新規交際不可）
 *
 * フロー:
 * 1. requestCheck: 相手のメールアドレスに確認メールを送信
 * 2. grantConsent: 相手が同意ページでトークンを承認
 * 3. getResult: 依頼者が結果（シングル/イエロー/レッド）を取得
 */
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  calcPartnerStatusResult,
  createPartnerStatusInquiry,
  getPartnerStatusInquiryByToken,
  getPartnerStatusInquiriesByRequester,
  updatePartnerStatusInquiry,
  getUserById,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { sendPushToUser } from "../push";

// ステータスの日本語ラベル
const STATUS_LABELS = {
  single: "シングル",
  yellow: "イエロー",
  red: "レッド",
  not_registered: "未登録",
} as const;

// ステータスの説明
const STATUS_DESCRIPTIONS = {
  single: "現在パートナーはいません。新しい交際が可能な状態です。",
  yellow: "90日以内に交際解消の経緯があります。新しい交際は可能ですが、慎重にご判断ください。",
  red: "現在パートナーがいます。新しい交際登録はできません。",
  not_registered: "恋人証明に登録されていないメールアドレスです。",
} as const;

export const partnerStatusRouter = router({
  /**
   * パートナーステータス確認リクエストを送信
   * 相手のメールアドレスに確認メールを送信する
   */
  requestCheck: protectedProcedure
    .input(
      z.object({
        targetEmail: z.string().email("有効なメールアドレスを入力してください"),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requester = await getUserById(ctx.user.id);
      if (!requester) throw new TRPCError({ code: "NOT_FOUND" });

      // 自分自身のメールへの問い合わせは不可
      if (requester.email === input.targetEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "自分自身のメールアドレスには問い合わせできません。",
        });
      }

      // eKYC完了確認（本人確認済みのユーザーのみ利用可能）
      if (requester.kycStatus !== "verified") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "パートナーステータスの確認には本人確認（eKYC）が必要です。",
        });
      }

      // 同じメールへの直近24時間以内の重複問い合わせを防止
      const db = await getDb();
      if (db) {
        const { partnerStatusInquiries } = await import("../../drizzle/schema");
        const { and, eq: eqOp, sql: sqlOp } = await import("drizzle-orm");
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentInquiries = await db
          .select({ id: partnerStatusInquiries.id })
          .from(partnerStatusInquiries)
          .where(
            and(
              eqOp(partnerStatusInquiries.requesterId, ctx.user.id),
              eqOp(partnerStatusInquiries.targetEmail, input.targetEmail),
              eqOp(partnerStatusInquiries.status, "pending"),
              sqlOp`${partnerStatusInquiries.createdAt} >= ${oneDayAgo}`
            )
          )
          .limit(1);
        if (recentInquiries.length > 0) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "同じメールアドレスへの問い合わせは24時間以内に1回のみです。",
          });
        }
      }

      // 対象ユーザーがシステムに登録済みか確認
      let targetUserId: number | undefined;
      if (db) {
        const targetUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, input.targetEmail))
          .limit(1);
        if (targetUsers.length > 0) {
          targetUserId = targetUsers[0].id;
        }
      }

      // トークン生成（72時間有効）
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      await createPartnerStatusInquiry({
        requesterId: ctx.user.id,
        targetEmail: input.targetEmail,
        targetUserId: targetUserId ?? null,
        token,
        expiresAt,
      } as Parameters<typeof createPartnerStatusInquiry>[0]);

      // 確認メールを送信
      const consentUrl = `${input.origin}/partner-status-consent?token=${token}`;
      const requesterName = requester.displayName ?? requester.name ?? "あなたの交際相手候補";

      if (process.env.RESEND_API_KEY) {
        try {
          const fromAddress = process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev";
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromAddress,
              to: input.targetEmail,
              subject: `【恋人証明】パートナーステータスの確認依頼が届きました`,
              html: buildConsentEmailHtml(requesterName, consentUrl),
            }),
          });
          console.log(`[PartnerStatus] Consent email sent to ${input.targetEmail}`);
        } catch (err) {
          console.error("[PartnerStatus] Failed to send consent email:", err);
          // メール送信失敗でも問い合わせ作成は成功とする
        }
      }

      return {
        success: true,
        message: `${input.targetEmail} に確認メールを送信しました。相手が同意すると結果が開示されます。`,
        expiresAt,
      };
    }),

  /**
   * 問い合わせ結果を取得（依頼者側）
   * 相手が同意した後に結果を取得する
   */
  getMyInquiries: protectedProcedure.query(async ({ ctx }) => {
    const inquiries = await getPartnerStatusInquiriesByRequester(ctx.user.id);
    return inquiries.map((inq) => ({
      id: inq.id,
      targetEmail: inq.targetEmail,
      status: inq.status,
      result: inq.result,
      resultLabel: inq.result ? STATUS_LABELS[inq.result] : null,
      resultDescription: inq.result ? STATUS_DESCRIPTIONS[inq.result] : null,
      expiresAt: inq.expiresAt,
      createdAt: inq.createdAt,
    }));
  }),

  /**
   * 同意ページ用: トークンで問い合わせ情報を取得（公開）
   */
  getInquiryByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const inquiry = await getPartnerStatusInquiryByToken(input.token);
      if (!inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "確認リンクが見つかりません。",
        });
      }
      if (new Date() > inquiry.expiresAt) {
        await updatePartnerStatusInquiry(inquiry.id, { status: "expired" });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この確認リンクの有効期限が切れています（72時間）。",
        });
      }
      if (inquiry.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            inquiry.status === "consented"
              ? "この確認リクエストはすでに承認されています。"
              : inquiry.status === "declined"
              ? "この確認リクエストはすでに拒否されています。"
              : "この確認リクエストは無効です。",
        });
      }
      // 依頼者情報を取得
      const requester = await getUserById(inquiry.requesterId);
      return {
        inquiryId: inquiry.id,
        requesterName: requester?.displayName ?? requester?.name ?? "不明なユーザー",
        requesterAvatarUrl: requester?.avatarUrl,
        targetEmail: inquiry.targetEmail,
        expiresAt: inquiry.expiresAt,
        status: inquiry.status,
      };
    }),

  /**
   * 同意ページ用: 同意または拒否（公開）
   * 相手がトークンを使って同意/拒否する
   */
  respondToInquiry: publicProcedure
    .input(
      z.object({
        token: z.string(),
        consent: z.boolean(), // true=同意, false=拒否
      })
    )
    .mutation(async ({ input }) => {
      const inquiry = await getPartnerStatusInquiryByToken(input.token);
      if (!inquiry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "確認リンクが見つかりません。" });
      }
      if (new Date() > inquiry.expiresAt) {
        await updatePartnerStatusInquiry(inquiry.id, { status: "expired" });
        throw new TRPCError({ code: "BAD_REQUEST", message: "有効期限が切れています。" });
      }
      if (inquiry.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "すでに回答済みです。" });
      }

      if (!input.consent) {
        // 拒否
        await updatePartnerStatusInquiry(inquiry.id, { status: "declined" });
        return { success: true, consented: false };
      }

      // 同意: ステータスを判定して結果を保存
      let result: "single" | "yellow" | "red" | "not_registered";

      if (inquiry.targetUserId) {
        // 登録済みユーザー: 実際のステータスを判定
        result = await calcPartnerStatusResult(inquiry.targetUserId);
      } else {
        // 未登録ユーザー
        result = "not_registered";
      }

      await updatePartnerStatusInquiry(inquiry.id, {
        status: "consented",
        result,
      });

      // 依頼者へプッシュ通知を送信（非同期・失敗しても処理継続）
      const resultEmoji = result === "single" ? "🟢" : result === "yellow" ? "🟡" : result === "red" ? "🔴" : "⚪";
      const pushLabel = STATUS_LABELS[result];
      sendPushToUser(inquiry.requesterId, {
        title: "パートナーステータスの結果が届きました",
        body: `${inquiry.targetEmail} の判定：${resultEmoji} ${pushLabel}`,
        url: "/dashboard",
      }).catch(() => { /* push通知失敗は無視 */ });

      return {
        success: true,
        consented: true,
        result,
        resultLabel: STATUS_LABELS[result],
        resultDescription: STATUS_DESCRIPTIONS[result],
      };
    }),
});

// 同意確認メールのHTMLテンプレート
function buildConsentEmailHtml(requesterName: string, consentUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>パートナーステータスの確認依頼</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f4f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- ヘッダー -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;margin-bottom:8px;">💕</div>
              <div style="color:#e91e8c;font-size:22px;font-weight:bold;letter-spacing:2px;">恋人証明</div>
              <div style="color:#ffffff;font-size:13px;margin-top:4px;opacity:0.8;">Koibito Shomei</div>
            </td>
          </tr>
          <!-- 本文 -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;font-size:20px;margin:0 0 16px 0;">パートナーステータスの確認依頼が届きました</h2>
              <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
                <strong style="color:#e91e8c;">${requesterName}</strong> さんから、あなたのパートナーステータス（シングル/イエロー/レッド）の確認依頼が届きました。
              </p>

              <!-- 説明ボックス -->
              <div style="background:#fdf2f8;border-left:4px solid #e91e8c;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="color:#444;font-size:14px;line-height:1.7;margin:0;">
                  <strong>パートナーステータスとは？</strong><br>
                  恋人証明が提供する、交際状況の透明性を確保するための機能です。<br>
                  あなたが同意した場合のみ、以下の情報が相手に開示されます：
                </p>
                <ul style="color:#444;font-size:14px;line-height:1.8;margin:8px 0 0 0;padding-left:20px;">
                  <li>🟢 <strong>シングル</strong>：現在パートナーなし</li>
                  <li>🟡 <strong>イエロー</strong>：90日以内に交際解消あり</li>
                  <li>🔴 <strong>レッド</strong>：現在交際中</li>
                </ul>
              </div>

              <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 32px 0;">
                同意しない場合は「拒否する」をクリックしてください。拒否した場合、相手には「回答なし」と表示されます。
              </p>

              <!-- CTAボタン -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${consentUrl}" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#ffffff;font-size:16px;font-weight:bold;padding:16px 48px;border-radius:50px;text-decoration:none;letter-spacing:1px;">
                      ✅ 同意して開示する
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${consentUrl}?decline=true" style="display:inline-block;background:#f5f5f5;color:#666;font-size:14px;padding:12px 32px;border-radius:50px;text-decoration:none;">
                      拒否する
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#999;font-size:12px;text-align:center;margin:24px 0 0 0;">
                このリンクは72時間有効です。心当たりがない場合は無視してください。
              </p>
            </td>
          </tr>
          <!-- フッター -->
          <tr>
            <td style="background:#f8f4f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                © 2025 恋人証明 | <a href="https://loverschain.jp" style="color:#e91e8c;text-decoration:none;">loverschain.jp</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
