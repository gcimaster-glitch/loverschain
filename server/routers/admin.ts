/**
 * 管理者専用ルーター
 * adminロールのユーザーのみアクセス可能。
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  countNotificationLogs,
  getNotificationLogs,
  getPartnershipById,
  insertNotificationLog,
  getUserById,
  getUsersPendingSingleCert,
  getUsersReviewedSingleCert,
  getSingleCertStats,
  reviewSingleCertificate,
  getAllUsers,
  getUsersCount,
  setUserPendingPlan,
  getKycStats,
  getDb,
} from "../db";
import { sendPushToUser } from "../push";
import { calcElapsedDays, getMilestoneInfo } from "../../shared/milestone";

/** admin ロールのみ通過させるミドルウェア */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "管理者権限が必要です" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /** 節目通知を手動再送する */
  resendNotification: adminProcedure
    .input(
      z.object({
        partnershipId: z.number().int().positive(),
        milestoneLabel: z.string().optional(), // 未指定の場合は現在の節目を自動判定
      })
    )
    .mutation(async ({ input }) => {
      const partnership = await getPartnershipById(input.partnershipId);
      if (!partnership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "指定されたパートナーシップが見つかりません" });
      }
      if (!partnership.startedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "交際開始日が未設定です" });
      }

      const elapsedDays = calcElapsedDays(new Date(partnership.startedAt));
      const milestone = getMilestoneInfo(elapsedDays);

      // 節目ラベル: 入力されたものを優先、なければ現在の節目を使用
      const label = input.milestoneLabel ?? (milestone.isMilestone ? milestone.label : `交際${elapsedDays}日目`);
      const title = `🎉 ${label}おめでとうございます！`;
      const body = `交際${elapsedDays.toLocaleString("ja-JP")}日目を迎えました。証明書を確認しましょう！`;
      const url = `/certificate/${partnership.id}`;
      const tag = `milestone-resend-${partnership.id}-${Date.now()}`;

      const [r1, r2] = await Promise.allSettled([
        sendPushToUser(partnership.user1Id, { title, body, url, tag }),
        sendPushToUser(partnership.user2Id, { title, body, url, tag }),
      ]);

      // ログ記録
      await Promise.all([
        insertNotificationLog({
          partnershipId: partnership.id,
          userId: partnership.user1Id,
          milestoneLabel: label,
          milestoneDays: elapsedDays,
          status: r1.status === "fulfilled" ? "sent" : "failed",
          errorMessage: r1.status === "rejected" ? String((r1 as PromiseRejectedResult).reason) : undefined,
        }).catch(() => {}),
        insertNotificationLog({
          partnershipId: partnership.id,
          userId: partnership.user2Id,
          milestoneLabel: label,
          milestoneDays: elapsedDays,
          status: r2.status === "fulfilled" ? "sent" : "failed",
          errorMessage: r2.status === "rejected" ? String((r2 as PromiseRejectedResult).reason) : undefined,
        }).catch(() => {}),
      ]);

      const sentCount = [r1, r2].filter((r) => r.status === "fulfilled").length;
      const failedCount = 2 - sentCount;
      return {
        success: true,
        partnershipId: partnership.id,
        label,
        elapsedDays,
        sentCount,
        failedCount,
      };
    }),

  /** 独身証明書審査待ち一覧 */
  listPendingSingleCerts: adminProcedure.query(async () => {
    return getUsersPendingSingleCert();
  }),

  /** 独身証明書審査済み一覧（承認・却下） */
  listReviewedSingleCerts: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return getUsersReviewedSingleCert(input.limit, input.offset);
    }),

  /** 独身証明書ステータス別統計 */
  singleCertStats: adminProcedure.query(async () => {
    return getSingleCertStats();
  }),

  /** 独身証明書承認/却下 */
  reviewSingleCert: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        approved: z.boolean(),
        rejectReason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
      }
      if (user.singleCertificateStatus !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "審査待ちの独身証明書がありません" });
      }
      await reviewSingleCertificate(input.userId, input.approved, input.rejectReason);
      return {
        success: true,
        message: input.approved
          ? "独身証明書を承認しました"
          : "独身証明書を却下しました",
      };
    }),

  /** ユーザー一覧（ページネーション対応） */
  listUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const [users, total] = await Promise.all([
        getAllUsers(input.limit, input.offset),
        getUsersCount(),
      ]);
      return { users, total };
    }),

  /** 銀行振込確認後の手動プラン設定 */
  setPendingPlan: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        planType: z.enum(["lover", "engagement", "student"]).nullable(),
        paidAt: z.string().datetime().nullable(), // ISO 8601文字列
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
      }
      const paidAt = input.paidAt ? new Date(input.paidAt) : null;
      await setUserPendingPlan(input.userId, input.planType, paidAt);
      return {
        success: true,
        message: input.planType
          ? `プランを設定しました（${input.planType}）`
          : "プラン設定をリセットしました",
      };
    }),

  /** 通知送信履歴一覧（ページネーション対応） */
  listNotificationLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        partnershipId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const [logs, total] = await Promise.all([
        getNotificationLogs({
          limit: input.limit,
          offset: input.offset,
          partnershipId: input.partnershipId,
        }),
        countNotificationLogs(input.partnershipId),
      ]);
      return { logs, total };
    }),

  /** eKYC統計ダッシュボード */
  kycStats: adminProcedure.query(async () => {
    return getKycStats();
  }),

  // ── パートナーステータス問い合わせ管理 ─────────────────────────────────────────────────────────────────────────────────────
  /** パートナーステータス問い合わせ一覧（ページネーション対応） */
  listPartnerStatusInquiries: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["pending", "consented", "declined", "expired", "all"]).default("all"),
        requesterId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { inquiries: [], total: 0 };
      const { partnerStatusInquiries, users } = await import("../../drizzle/schema");
      const { eq, desc, and, count, sql } = await import("drizzle-orm");
      const conditions = [];
      if (input.status !== "all") {
        conditions.push(eq(partnerStatusInquiries.status, input.status as "pending" | "consented" | "declined" | "expired"));
      }
      if (input.requesterId) {
        conditions.push(eq(partnerStatusInquiries.requesterId, input.requesterId));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [inquiries, totalResult] = await Promise.all([
        db
          .select({
            id: partnerStatusInquiries.id,
            requesterId: partnerStatusInquiries.requesterId,
            requesterName: users.displayName,
            requesterEmail: users.email,
            targetEmail: partnerStatusInquiries.targetEmail,
            status: partnerStatusInquiries.status,
            result: partnerStatusInquiries.result,
            expiresAt: partnerStatusInquiries.expiresAt,
            createdAt: partnerStatusInquiries.createdAt,
          })
          .from(partnerStatusInquiries)
          .leftJoin(users, eq(partnerStatusInquiries.requesterId, users.id))
          .where(whereClause)
          .orderBy(desc(partnerStatusInquiries.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: count() })
          .from(partnerStatusInquiries)
          .where(whereClause),
      ]);
      return { inquiries, total: totalResult[0]?.count ?? 0 };
    }),

  /** 日次問い合わせ数ランキング（スパム検知） */
  partnerStatusSpamReport: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(7), // 集計日数
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { report: [] };
      const { partnerStatusInquiries, users } = await import("../../drizzle/schema");
      const { eq, desc, count, gte } = await import("drizzle-orm");
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const report = await db
        .select({
          requesterId: partnerStatusInquiries.requesterId,
          requesterName: users.displayName,
          requesterEmail: users.email,
          inquiryCount: count(partnerStatusInquiries.id),
        })
        .from(partnerStatusInquiries)
        .leftJoin(users, eq(partnerStatusInquiries.requesterId, users.id))
        .where(gte(partnerStatusInquiries.createdAt, since))
        .groupBy(partnerStatusInquiries.requesterId, users.displayName, users.email)
        .orderBy(desc(count(partnerStatusInquiries.id)))
        .limit(input.limit);
      return { report, since, days: input.days };
    }),

  /** 日次上限設定（システム設定テーブルを使わず、将来的に拡張するためのスタブ） */
  partnerStatusDailyLimitInfo: adminProcedure.query(async () => {
    // 現在の実装：24時間内に同じメールへの重複問い合わせは不可
    // 将来的にグローバル日次上限（全メール合計）を追加予定
    return {
      currentRule: "24時間内に同じメールアドレスへの問い合わせは1回のみ",
      globalDailyLimit: null, // 未実装（将来追加予定）
      note: "グローバル日次上限はシステム設定テーブル実装待ち",
    };
  }),

  /** 問い合わせを強制キャンセル（スパム対応） */
  cancelPartnerStatusInquiry: adminProcedure
    .input(z.object({ inquiryId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { partnerStatusInquiries } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await db
        .update(partnerStatusInquiries)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(partnerStatusInquiries.id, input.inquiryId));
      return { success: true };
    }),
});
