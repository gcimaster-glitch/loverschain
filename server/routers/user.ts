import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import {
  getAllUsers,
  getUserById,
  getUsersByKycStatus,
  getUsersCount,
  updateUserKycStatus,
  updateUserProfile,
  saveEmailVerificationCode,
  markEmailVerified,
  saveSmsVerificationCode,
  markPhoneVerified,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const userRouter = router({
  // 自分のプロフィール取得
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  // プロフィール更新
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100).optional(),
        gender: z
          .enum(["male", "female", "other", "prefer_not_to_say"])
          .optional(),
        birthDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        phone: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  // eKYCセッション開始（Stripe Identity）
  startKyc: protectedProcedure
    .input(z.object({ origin: z.string().url().optional() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      if (user.kycStatus === "verified") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "すでに本人確認が完了しています",
        });
      }
      // Stripe APIキーが設定されていない場合はモックモードで動作
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        // モック: 開発環境用
        const mockSessionId = `vs_mock_${Date.now()}`;
        await updateUserKycStatus(ctx.user.id, "pending", mockSessionId);
        return {
          sessionId: mockSessionId,
          clientSecret: `mock_secret_${Date.now()}`,
          url: null,
          mock: true,
        };
      }
      try {
        // Stripe SDKを使ってIdentity VerificationSessionを作成
        const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
        const returnOrigin = input?.origin ?? "https://loverschain.jp";
        const session = await stripe.identity.verificationSessions.create({
          type: "document",
          options: {
            document: {
              allowed_types: ["driving_license", "id_card", "passport"],
              require_id_number: false,
              require_live_capture: true,
              require_matching_selfie: true,
            },
          },
          return_url: `${returnOrigin}/kyc?kyc_completed=1`,
          metadata: {
            user_id: String(ctx.user.id),
          },
        });
        await updateUserKycStatus(ctx.user.id, "pending", session.id);
        console.log(`[KYC] Session created: ${session.id}, livemode: ${session.livemode}, url: ${session.url}`);
        return {
          sessionId: session.id,
          clientSecret: session.client_secret ?? "",
          url: session.url ?? null,
          mock: false,
        };
      } catch (error) {
        const stripeError = error as { type?: string; code?: string; message?: string };
        console.error("[KYC] Failed to create Stripe session:", {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `本人確認セッションの作成に失敗しました: ${stripeError.message ?? "不明なエラー"}`,
        });
      }
    }),

  // 開発用: eKYCを手動で完了させる（本番では使用しない）
  mockVerifyKyc: protectedProcedure.mutation(async ({ ctx }) => {
    if (process.env.NODE_ENV === "production") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    await updateUserKycStatus(ctx.user.id, "verified");
    return { success: true };
  }),

  // 管理者: ユーザー一覧
  adminList: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        kycStatus: z
          .enum(["not_started", "pending", "verified", "failed"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const [userList, total] = await Promise.all([
        input.kycStatus
          ? getUsersByKycStatus(input.kycStatus)
          : getAllUsers(input.limit, input.offset),
        getUsersCount(),
      ]);
      return { users: userList, total };
    }),

  // 管理者: eKYC審査（手動承認/却下）
  adminReviewKyc: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["verified", "failed"]),
        kycErrorCode: z.string().optional(), // 却下時の理由コード
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateUserKycStatus(
        input.userId,
        input.status,
        undefined,
        input.status === "failed" ? (input.kycErrorCode ?? null) : null
      );
      return { success: true };
    }),

  // メール認証コード送信
  sendEmailVerification: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      if (user.emailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "メールアドレスはすでに認証済みです" });
      }

      // 6桁の認証コードを生成
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分後
      await saveEmailVerificationCode(ctx.user.id, code, expiresAt);

      // Resendメール送信
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "no-reply@loverschain.jp",
              to: input.email,
              subject: "【恋人証明】メールアドレスの認証",
              html: `<p>認証コード: <strong>${code}</strong></p><p>このコードは10分間有効です。</p>`,
            }),
          });
        } catch (e) {
          console.warn("[Email] verification send failed:", e);
        }
      } else {
        // 開発環境: コンソールに出力
        console.log(`[Dev] Email verification code for user ${ctx.user.id}: ${code}`);
      }

      return { success: true, message: "認証コードを送信しました。メールをご確認ください。" };
    }),

  // メール認証コード検証
  verifyEmail: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      if (user.emailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "メールアドレスはすでに認証済みです" });
      }

      if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "認証コードが発行されていません。再送信してください。" });
      }

      if (new Date() > user.emailVerificationExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "認証コードの有効期限が切れました。再送信してください。" });
      }

      if (user.emailVerificationCode !== input.code) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "認証コードが一致しません。" });
      }

      await markEmailVerified(ctx.user.id);
      return { success: true, message: "メールアドレスの認証が完了しました。" };
    }),

  // SMS認証コード送信（Twilioまたはモック）
  sendSmsVerification: protectedProcedure
    .input(z.object({ phone: z.string().min(10).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      if (user.phoneVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "電話番号はすでに認証済みです" });
      }

      // 6桁の認証コードを生成
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分後
      await saveSmsVerificationCode(ctx.user.id, code, expiresAt);
      // SMS送信時に電話番号をプロフィールにも保存（プロフィールと認証を統合）
      await updateUserProfile(ctx.user.id, { phone: input.phone });

      // Twilio SMS送信
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_FROM_NUMBER;

      if (twilioSid && twilioToken && twilioFrom) {
        try {
          const body = `【恋人証明】認証コード: ${code}\n10分間有効です。`;
          // 日本の携帯番号をE.164形式に変換（080-xxxx-xxxx → +8180xxxxxxxx）
          let toNumber = input.phone.replace(/[-\s]/g, "");
          if (toNumber.startsWith("0")) {
            toNumber = "+81" + toNumber.slice(1);
          } else if (!toNumber.startsWith("+")) {
            toNumber = "+" + toNumber;
          }
          const params = new URLSearchParams({
            From: twilioFrom,
            To: toNumber,
            Body: body,
          });
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params.toString(),
            }
          );
          if (!response.ok) {
            const err = await response.text();
            console.error("[Twilio] SMS send failed:", err);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "SMS送信に失敗しました。番号をご確認ください。" });
          }
        } catch (e) {
          if (e instanceof TRPCError) throw e;
          console.error("[Twilio] SMS send error:", e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "SMS送信に失敗しました。" });
        }
      } else {
        // 開発環境: コンソールに出力
        console.log(`[Dev] SMS verification code for user ${ctx.user.id}: ${code}`);
      }

      return { success: true, message: "SMS認証コードを送信しました。スマートフォンをご確認ください。" };
    }),

  // SMS認証コード検証
  verifySms: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      if (user.phoneVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "電話番号はすでに認証済みです" });
      }

      if (!user.smsVerificationCode || !user.smsVerificationExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "認証コードが発行されていません。再送信してください。" });
      }

      if (new Date() > user.smsVerificationExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "認証コードの有効期限が切れました。再送信してください。" });
      }

      if (user.smsVerificationCode !== input.code) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "認証コードが一致しません。" });
      }

      await markPhoneVerified(ctx.user.id);
      return { success: true, message: "電話番号の認証が完了しました。" };
    }),

  // アバター写真アップロード
  uploadAvatar: protectedProcedure
    .input(
      z.object({
        // Base64エンコードされた画像データ（data:image/jpeg;base64,...形式）
        dataUrl: z.string().max(5 * 1024 * 1024), // 5MB以内
      })
    )
    .mutation(async ({ ctx, input }) => {
      // data URLからBase64部分を抽出
      const matches = input.dataUrl.match(/^data:([a-zA-Z0-9+/]+\/[a-zA-Z0-9+/]+);base64,(.+)$/);
      if (!matches) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "画像データの形式が不正です" });
      }
      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // ファイルサイズチェック（2MB以内）
      if (buffer.length > 2 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "画像サイズは2MB以内にしてください" });
      }

      const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const fileKey = `avatars/${ctx.user.id}-${Date.now()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, contentType);

      await updateUserProfile(ctx.user.id, { avatarUrl: url });
      return { success: true, avatarUrl: url };
    }),

  // 公開: ユーザーの公開プロフィール（証明書検証用）
  publicProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      // 公開情報のみ返す
      return {
        id: user.id,
        displayName: user.displayName ?? user.name,
        avatarUrl: user.avatarUrl,
        kycStatus: user.kycStatus,
        partnershipStatus: user.partnershipStatus,
        createdAt: user.createdAt,
      };
    }),
});
