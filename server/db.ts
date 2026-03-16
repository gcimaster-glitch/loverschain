import { and, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertPartnerStatusInquiry,
  dissolutionRequests,
  invitations,
  notificationLogs,
  partnerStatusInquiries,
  partnershipStatusHistory,
  partnerships,
  pushSubscriptions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================
// Users
// ============================================================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod", "avatarUrl"] as const;
  for (const f of fields) {
    if (user[f] !== undefined) {
      values[f] = user[f] ?? null;
      updateSet[f] = user[f] ?? null;
    }
  }

  const now = new Date();
  values.lastSignedIn = now;
  updateSet.lastSignedIn = now;

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  id: number,
  data: Partial<{
    displayName: string;
    gender: "male" | "female" | "other" | "prefer_not_to_say";
    birthDate: string;
    phone: string;
    avatarUrl: string;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function updateUserKycStatus(
  id: number,
  status: "not_started" | "pending" | "verified" | "failed",
  sessionId?: string,
  errorCode?: string | null
) {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = { kycStatus: status };
  if (sessionId) update.stripeVerificationSessionId = sessionId;
  if (status === "verified") {
    update.kycVerifiedAt = new Date();
    update.kycErrorCode = null; // 承認時はエラーコードをクリア
  }
  if (errorCode !== undefined) update.kycErrorCode = errorCode;
  await db.update(users).set(update).where(eq(users.id, id));
}

export async function updateUserPartnershipStatus(
  id: number,
  status: "single" | "green" | "engaged" | "yellow" | "gray" | "blue" | "white"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ partnershipStatus: status }).where(eq(users.id, id));
}

// 浮気防止: アクティブなパートナーシップを持つユーザーかどうか確認
export async function hasActivePartnership(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: partnerships.id })
    .from(partnerships)
    .where(
      and(
        or(eq(partnerships.user1Id, userId), eq(partnerships.user2Id, userId)),
        or(
          eq(partnerships.status, "green"),
          eq(partnerships.status, "engaged"),
          eq(partnerships.status, "yellow"),
          eq(partnerships.status, "gray"),
          eq(partnerships.status, "blue")
        )
      )
    )
    .limit(1);
  return result.length > 0;
}

// メール認証コードの保存
export async function saveEmailVerificationCode(
  userId: number,
  code: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ emailVerificationCode: code, emailVerificationExpiresAt: expiresAt })
    .where(eq(users.id, userId));
}

// メール認証完了
export async function markEmailVerified(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationCode: null,
      emailVerificationExpiresAt: null,
    })
    .where(eq(users.id, userId));
}

// SMS認証コードの保存
export async function saveSmsVerificationCode(
  userId: number,
  code: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ smsVerificationCode: code, smsVerificationExpiresAt: expiresAt })
    .where(eq(users.id, userId));
}

// SMS認証完了
export async function markPhoneVerified(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      smsVerificationCode: null,
      smsVerificationExpiresAt: null,
    })
    .where(eq(users.id, userId));
}

// 独身証明書アップロード
export async function updateSingleCertificate(
  userId: number,
  url: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({
      singleCertificateUrl: url,
      singleCertificateStatus: "pending",
      singleCertificateUploadedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// 独身証明書審査（管理者）
export async function reviewSingleCertificate(
  userId: number,
  approved: boolean,
  rejectReason?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({
      singleCertificateStatus: approved ? "approved" : "rejected",
      singleCertificateReviewedAt: new Date(),
      singleCertificateRejectReason: approved ? null : (rejectReason ?? null),
    })
    .where(eq(users.id, userId));
}

// 独身証明書審査済み一覧（管理者用）
export async function getUsersReviewedSingleCert(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(users)
    .where(
      or(
        eq(users.singleCertificateStatus, "approved"),
        eq(users.singleCertificateStatus, "rejected")
      )
    )
    .orderBy(desc(users.singleCertificateReviewedAt))
    .limit(limit)
    .offset(offset);
}

// 独身証明書ステータス別件数（管理者用）
export async function getSingleCertStats() {
  const db = await getDb();
  if (!db) return { pending: 0, approved: 0, rejected: 0 };
  const rows = await db
    .select({
      status: users.singleCertificateStatus,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(
      or(
        eq(users.singleCertificateStatus, "pending"),
        eq(users.singleCertificateStatus, "approved"),
        eq(users.singleCertificateStatus, "rejected")
      )
    )
    .groupBy(users.singleCertificateStatus);
  const result = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) {
    if (row.status === "pending") result.pending = Number(row.count);
    else if (row.status === "approved") result.approved = Number(row.count);
    else if (row.status === "rejected") result.rejected = Number(row.count);
  }
  return result;
}

// プロフィール拡張情報の更新（都道府県・証明書表示設定）
export async function updateUserCertSettings(
  userId: number,
  data: Partial<{
    prefecture: string;
    showPrefectureOnCert: boolean;
    showNameOnCert: boolean;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// 婚約ステータスに更新（独身証明書承認後）
export async function updatePartnershipToEngaged(partnershipId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(partnerships)
    .set({ status: "engaged" })
    .where(eq(partnerships.id, partnershipId));
}

// 独身証明書審査待ちのユーザー一覧（管理者用）
export async function getUsersPendingSingleCert() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(users)
    .where(eq(users.singleCertificateStatus, "pending"))
    .orderBy(desc(users.singleCertificateUploadedAt));
}

/** 管理者による銀行振込確認後の手動プラン設定 */
export async function setUserPendingPlan(
  userId: number,
  planType: "lover" | "engagement" | "student" | null,
  paidAt: Date | null
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ pendingPlanType: planType, pendingPlanPaidAt: paidAt })
    .where(eq(users.id, userId));
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getUsersCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
}

export async function getUsersByKycStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(users)
    .where(eq(users.kycStatus, status as "not_started" | "pending" | "verified" | "failed"))
    .orderBy(desc(users.createdAt));
}

// ============================================================
// Invitations
// ============================================================
export async function createInvitation(data: {
  inviterId: number;
  inviteeEmail?: string;
  invitationKey: string;
  planType?: "lover" | "engagement" | "student";
  expiresAt: Date;
  isSplitPayment?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(invitations).values({
    inviterId: data.inviterId,
    inviteeEmail: data.inviteeEmail,
    invitationKey: data.invitationKey,
    planType: data.planType ?? "lover",
    expiresAt: data.expiresAt,
    isSplitPayment: data.isSplitPayment ?? false,
  });
}

export async function getInvitationByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(invitations)
    .where(eq(invitations.invitationKey, key))
    .limit(1);
  return result[0];
}

export async function updateInvitationStatus(
  id: number,
  status: "pending" | "accepted" | "expired" | "cancelled"
) {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = { status };
  if (status === "accepted") update.acceptedAt = new Date();
  await db.update(invitations).set(update).where(eq(invitations.id, id));
}

export async function getInvitationsByInviter(inviterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(invitations)
    .where(eq(invitations.inviterId, inviterId))
    .orderBy(desc(invitations.createdAt));
}

// ============================================================
// Partnerships
// ============================================================
export async function createPartnership(data: {
  user1Id: number;
  user2Id: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(partnerships).values({
    user1Id: data.user1Id,
    user2Id: data.user2Id,
    status: "green",
  });
  return result;
}

export async function getPartnershipById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(partnerships)
    .where(eq(partnerships.id, id))
    .limit(1);
  return result[0];
}

export async function getActivePartnershipByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(partnerships)
    .where(
      and(
        or(eq(partnerships.user1Id, userId), eq(partnerships.user2Id, userId)),
        or(
          eq(partnerships.status, "green"),
          eq(partnerships.status, "yellow"),
          eq(partnerships.status, "gray"),
          eq(partnerships.status, "blue")
        )
      )
    )
    .limit(1);
  return result[0];
}

export async function updatePartnershipStatus(
  id: number,
  status: "green" | "yellow" | "gray" | "blue" | "white",
  extra?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = { status, ...extra };
  if (status === "white") update.endedAt = new Date();
  await db.update(partnerships).set(update).where(eq(partnerships.id, id));
}

export async function updatePartnershipBlockchain(
  id: number,
  txHash: string,
  certificateUrl: string,
  jAgreementRecordId?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(partnerships)
    .set({
      blockchainTxHash: txHash,
      certificateUrl: certificateUrl,
      blockchainRegisteredAt: new Date(),
      ...(jAgreementRecordId ? { jAgreementRecordId } : {}),
    })
    .where(eq(partnerships.id, id));
}

export async function addPartnershipStatusHistory(data: {
  partnershipId: number;
  fromStatus?: string;
  toStatus: string;
  changedBy?: number;
  reason?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(partnershipStatusHistory).values(data);
}

export async function getPartnershipHistory(partnershipId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(partnershipStatusHistory)
    .where(eq(partnershipStatusHistory.partnershipId, partnershipId))
    .orderBy(desc(partnershipStatusHistory.createdAt));
}

export async function getAllPartnerships(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(partnerships)
    .orderBy(desc(partnerships.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getPartnershipsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(partnerships);
  return result[0]?.count ?? 0;
}

export async function getActivePartnershipsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(partnerships)
    .where(eq(partnerships.status, "green"));
  return result[0]?.count ?? 0;
}

// ============================================================
// Dissolution Requests
// ============================================================
export async function createDissolutionRequest(data: {
  partnershipId: number;
  requestedBy: number;
  type: "mutual" | "unilateral";
  reason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(dissolutionRequests).values(data);
}

export async function getDissolutionRequestByPartnership(partnershipId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(dissolutionRequests)
    .where(
      and(
        eq(dissolutionRequests.partnershipId, partnershipId),
        eq(dissolutionRequests.status, "pending")
      )
    )
    .orderBy(desc(dissolutionRequests.createdAt))
    .limit(1);
  return result[0];
}

export async function confirmDissolutionRequest(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(dissolutionRequests)
    .set({ status: "confirmed", confirmedAt: new Date() })
    .where(eq(dissolutionRequests.id, id));
}

export async function getPastPartnershipsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(partnerships)
    .where(
      and(
        or(eq(partnerships.user1Id, userId), eq(partnerships.user2Id, userId)),
        eq(partnerships.status, "white")
      )
    )
    .orderBy(desc(partnerships.endedAt))
    .limit(10);
  return result;
}

export async function cancelDissolutionRequest(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(dissolutionRequests)
    .set({ status: 'cancelled' })
    .where(eq(dissolutionRequests.id, id));
}

// ============================================================
// Push Subscriptions
// ============================================================
export async function upsertPushSubscription(data: {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // 同じエンドポイントが既に存在する場合は更新、なければ挿入
  await db
    .insert(pushSubscriptions)
    .values(data)
    .onDuplicateKeyUpdate({
      set: { p256dh: data.p256dh, auth: data.auth, userAgent: data.userAgent },
    });
}

export async function deletePushSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
}

export async function getPushSubscriptionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

export async function getAllActivePartnershipsWithStartedAt() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(partnerships)
    .where(
      or(
        eq(partnerships.status, "green"),
        eq(partnerships.status, "yellow"),
        eq(partnerships.status, "gray"),
        eq(partnerships.status, "blue")
      )
    );
}

// ============================================================
// Notification Logs
// ============================================================
export async function insertNotificationLog(data: {
  partnershipId: number;
  userId: number;
  milestoneLabel: string;
  milestoneDays: number;
  status: "sent" | "failed";
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notificationLogs).values({
    partnershipId: data.partnershipId,
    userId: data.userId,
    milestoneLabel: data.milestoneLabel,
    milestoneDays: data.milestoneDays,
    status: data.status,
    errorMessage: data.errorMessage ?? null,
  });
}

export async function getNotificationLogs(opts: {
  limit?: number;
  offset?: number;
  partnershipId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = opts.partnershipId
    ? [eq(notificationLogs.partnershipId, opts.partnershipId)]
    : [];
  return db
    .select()
    .from(notificationLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(notificationLogs.sentAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

export async function countNotificationLogs(partnershipId?: number) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = partnershipId
    ? [eq(notificationLogs.partnershipId, partnershipId)]
    : [];
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notificationLogs)
    .where(conditions.length ? and(...conditions) : undefined);
  return Number(result[0]?.count ?? 0);
}

// カップル写真URL更新（スマホ証明書用）
export async function updateCouplePhotoUrl(
  partnershipId: number,
  couplePhotoUrl: string | null
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(partnerships)
    .set({ couplePhotoUrl })
    .where(eq(partnerships.id, partnershipId));
}

// ============================================================
// KYC Statistics
// ============================================================

/** eKYC統計: ステータス別カウント・エラーコード内訳・平均審査時間 */
export async function getKycStats() {
  const db = await getDb();
  if (!db) {
    return {
      statusCounts: { not_started: 0, pending: 0, verified: 0, failed: 0 },
      errorCodeBreakdown: [] as { errorCode: string; count: number }[],
      avgReviewHours: null as number | null,
      recentFailed: [] as { id: number; name: string | null; email: string | null; kycErrorCode: string | null; updatedAt: Date | null }[],
    };
  }

  // ステータス別カウント
  const statusRows = await db
    .select({ status: users.kycStatus, count: sql<number>`count(*)` })
    .from(users)
    .groupBy(users.kycStatus);

  const statusCounts = { not_started: 0, pending: 0, verified: 0, failed: 0 };
  for (const row of statusRows) {
    if (row.status && row.status in statusCounts) {
      statusCounts[row.status as keyof typeof statusCounts] = Number(row.count);
    }
  }

  // エラーコード内訳（failedユーザーのみ）
  const errorRows = await db
    .select({ errorCode: users.kycErrorCode, count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.kycStatus, "failed"))
    .groupBy(users.kycErrorCode)
    .orderBy(desc(sql<number>`count(*)`));

  const errorCodeBreakdown = errorRows
    .filter((r) => r.errorCode)
    .map((r) => ({ errorCode: r.errorCode as string, count: Number(r.count) }));

  // 平均審査時間（createdAt → kycVerifiedAt, verifiedユーザーのみ）
  const avgRow = await db
    .select({
      avgHours: sql<number>`AVG(TIMESTAMPDIFF(HOUR, createdAt, kycVerifiedAt))`,
    })
    .from(users)
    .where(eq(users.kycStatus, "verified"));
  const avgReviewHours = avgRow[0]?.avgHours != null ? Number(avgRow[0].avgHours) : null;

  // 最近の失敗ユーザー（最新10件）
  const recentFailed = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      kycErrorCode: users.kycErrorCode,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.kycStatus, "failed"))
    .orderBy(desc(users.updatedAt))
    .limit(10);

  return { statusCounts, errorCodeBreakdown, avgReviewHours, recentFailed };
}

// ============================================================
// Partner Status Inquiries（パートナーステータス事前確認）
// ============================================================

/** 問い合わせを新規作成 */
export async function createPartnerStatusInquiry(data: InsertPartnerStatusInquiry) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(partnerStatusInquiries).values(data);
}

/** トークンで問い合わせを取得 */
export async function getPartnerStatusInquiryByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(partnerStatusInquiries)
    .where(eq(partnerStatusInquiries.token, token))
    .limit(1);
  return result[0];
}

/** IDで問い合わせを取得 */
export async function getPartnerStatusInquiryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(partnerStatusInquiries)
    .where(eq(partnerStatusInquiries.id, id))
    .limit(1);
  return result[0];
}

/** 問い合わせのステータスと結果を更新 */
export async function updatePartnerStatusInquiry(
  id: number,
  data: Partial<{
    status: "pending" | "consented" | "declined" | "expired";
    result: "single" | "yellow" | "red" | "not_registered";
    targetUserId: number;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(partnerStatusInquiries)
    .set(data)
    .where(eq(partnerStatusInquiries.id, id));
}

/** 依頼者の最近の問い合わせ一覧（最新10件） */
export async function getPartnerStatusInquiriesByRequester(requesterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(partnerStatusInquiries)
    .where(eq(partnerStatusInquiries.requesterId, requesterId))
    .orderBy(desc(partnerStatusInquiries.createdAt))
    .limit(10);
}

/**
 * ユーザーのパートナーステータスを判定する
 * - red: 現在アクティブなパートナーシップあり（green/engaged/yellow/gray/blue）
 * - yellow: 90日以内に解消申請または解消完了（dissolution_requestsを参照）
 * - single: パートナーなし
 */
export async function calcPartnerStatusResult(
  userId: number
): Promise<"single" | "yellow" | "red"> {
  const db = await getDb();
  if (!db) return "single";

  // アクティブなパートナーシップを確認
  const activePartnership = await db
    .select({ id: partnerships.id, status: partnerships.status })
    .from(partnerships)
    .where(
      and(
        or(eq(partnerships.user1Id, userId), eq(partnerships.user2Id, userId)),
        or(
          eq(partnerships.status, "green"),
          eq(partnerships.status, "engaged"),
          eq(partnerships.status, "yellow"),
          eq(partnerships.status, "gray"),
          eq(partnerships.status, "blue")
        )
      )
    )
    .limit(1);

  if (activePartnership.length > 0) {
    return "red";
  }

  // 90日以内に解消申請があるか確認（dissolution_requestsテーブル）
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  // 90日以内に解消完了（whiteステータスでendedAtが90日以内）のパートナーシップを確認
  const recentDissolution = await db
    .select({ id: partnerships.id, status: partnerships.status })
    .from(partnerships)
    .where(
      and(
        or(eq(partnerships.user1Id, userId), eq(partnerships.user2Id, userId)),
        eq(partnerships.status, "white"),
        sql`${partnerships.endedAt} >= ${ninetyDaysAgo}`
      )
    )
    .limit(1);

  if (recentDissolution.length > 0) {
    return "yellow";
  }

  return "single";
}
