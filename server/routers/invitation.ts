import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createInvitation,
  getActivePartnershipByUserId,
  getInvitationByKey,
  getInvitationsByInviter,
  getUserById,
  updateInvitationStatus,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const invitationRouter = router({
  // 招待キー発行
  create: protectedProcedure
    .input(
      z.object({
        inviteeEmail: z.string().email().optional(),
        origin: z.string().url(),
        isSplitPayment: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // eKYC完了確認
      if (user.kycStatus !== "verified") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "招待キーの発行には本人確認（eKYC）が必要です。マイページから本人確認を完了してください。",
        });
      }

      // 決済済みチェック（支払い前は招待リンクを発行できない）
      if (!user.pendingPlanType || !user.pendingPlanPaidAt) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message:
            "招待リンクの発行には先にプランのお支払いが必要です。プランを選択して決済を完了してください。",
        });
      }

      // 既存パートナーシップ確認
      const existing = await getActivePartnershipByUserId(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "すでにパートナーシップが存在します。新しい招待キーを発行できません。",
        });
      }

      // 決済済みプランを招待に引き継ぎ
      const planType = user.pendingPlanType;

      // 招待キー生成（24文字のランダム文字列）
      const invitationKey = nanoid(24);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日後

      await createInvitation({
        inviterId: ctx.user.id,
        inviteeEmail: input.inviteeEmail,
        invitationKey,
        planType,
        expiresAt,
        isSplitPayment: input.isSplitPayment ?? false,
      });

      const inviteUrl = `${input.origin}/invite/${invitationKey}`;

      // メール送信（Resend API）
      if (input.inviteeEmail && process.env.RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "恋人証明 <noreply@koibito-shomei.com>",
              to: input.inviteeEmail,
              subject: `${user.displayName ?? user.name ?? "あなた"}さんから恋人証明の招待が届きました`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #e91e8c;">💕 恋人証明への招待</h1>
                  <p>${user.displayName ?? user.name ?? "パートナー"}さんから、恋人証明の招待が届きました。</p>
                  <p>下記のリンクをクリックして、パートナーシップを成立させましょう。</p>
                  <a href="${inviteUrl}" style="display: inline-block; background: #e91e8c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                    招待を受け入れる
                  </a>
                  <p style="color: #666; font-size: 12px;">このリンクは7日間有効です。</p>
                  <p style="color: #666; font-size: 12px;">心当たりがない場合は、このメールを無視してください。</p>
                </div>
              `,
            }),
          });
        } catch (err) {
          console.error("[Invitation] Failed to send email:", err);
          // メール送信失敗でも招待キー発行は成功とする
        }
      }

      return {
        invitationKey,
        inviteUrl,
        expiresAt,
        planType,
      };
    }),

  // 招待キー検証（公開）
  verify: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const invitation = await getInvitationByKey(input.key);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "招待キーが見つかりません",
        });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            invitation.status === "accepted"
              ? "この招待はすでに使用されています"
              : "この招待は無効です",
        });
      }

      if (new Date() > invitation.expiresAt) {
        await updateInvitationStatus(invitation.id, "expired");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この招待の有効期限が切れています",
        });
      }

      // 招待者の公開情報を取得
      const inviter = await getUserById(invitation.inviterId);
      return {
        valid: true,
        invitationKey: invitation.invitationKey,
        inviterName: inviter?.displayName ?? inviter?.name ?? "不明",
        inviterAvatarUrl: inviter?.avatarUrl,
        expiresAt: invitation.expiresAt,
        planType: invitation.planType,
        isSplitPayment: invitation.isSplitPayment ?? false,
      };
    }),

  // 自分の招待一覧
  myInvitations: protectedProcedure.query(async ({ ctx }) => {
    return getInvitationsByInviter(ctx.user.id);
  }),

  // 招待キャンセル
  cancel: protectedProcedure
    .input(z.object({ invitationKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await getInvitationByKey(input.invitationKey);
      if (!invitation) throw new TRPCError({ code: "NOT_FOUND" });
      if (invitation.inviterId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateInvitationStatus(invitation.id, "cancelled");
      return { success: true };
    }),
});
