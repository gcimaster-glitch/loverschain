import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

// ============================================================
// users テーブル
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),

  // プロフィール拡張
  displayName: varchar("displayName", { length: 100 }),
  gender: mysqlEnum("gender", ["male", "female", "other", "prefer_not_to_say"]),
  birthDate: varchar("birthDate", { length: 10 }), // YYYY-MM-DD
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatarUrl"),

  // eKYC
  kycStatus: mysqlEnum("kycStatus", [
    "not_started",
    "pending",
    "verified",
    "failed",
  ])
    .default("not_started")
    .notNull(),
  kycVerifiedAt: timestamp("kycVerifiedAt"),
  kycErrorCode: varchar("kycErrorCode", { length: 100 }), // Stripe Identity last_error.code
  stripeVerificationSessionId: varchar("stripeVerificationSessionId", {
    length: 255,
  }),

  // パートナーシップ状態（高速参照用）
  partnershipStatus: mysqlEnum("partnershipStatus", [
    "single",
    "green",
    "engaged",
    "yellow",
    "gray",
    "blue",
    "white",
  ])
    .default("single")
    .notNull(),

  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),

  // コイン残高
  coinBalance: int("coinBalance").default(0).notNull(),

  // 紹介コード
  referralCode: varchar("referralCode", { length: 20 }).unique(),
  referredBy: int("referredBy"), // 紹介者のuserId

  // OEM代理店所属
  oemAgencyId: int("oemAgencyId"),

  // 高校生フラグ（割引適用）
  isHighSchoolStudent: boolean("isHighSchoolStudent").default(false).notNull(),
  studentVerifiedAt: timestamp("studentVerifiedAt"),

  // SMS・メール認証
  phoneVerified: boolean("phoneVerified").default(false).notNull(),
  phoneVerifiedAt: timestamp("phoneVerifiedAt"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  emailVerificationCode: varchar("emailVerificationCode", { length: 10 }),
  emailVerificationExpiresAt: timestamp("emailVerificationExpiresAt"),
  smsVerificationCode: varchar("smsVerificationCode", { length: 10 }),
  smsVerificationExpiresAt: timestamp("smsVerificationExpiresAt"),

  // 独身証明書
  singleCertificateUrl: text("singleCertificateUrl"),
  singleCertificateStatus: mysqlEnum("singleCertificateStatus", [
    "not_uploaded",
    "pending",
    "approved",
    "rejected",
  ]).default("not_uploaded").notNull(),
  singleCertificateUploadedAt: timestamp("singleCertificateUploadedAt"),
  singleCertificateReviewedAt: timestamp("singleCertificateReviewedAt"),
  singleCertificateRejectReason: text("singleCertificateRejectReason"),

  // 居住地（証明書表示用・任意）
  prefecture: varchar("prefecture", { length: 20 }),
  showPrefectureOnCert: boolean("showPrefectureOnCert").default(false).notNull(),
  showNameOnCert: boolean("showNameOnCert").default(true).notNull(),

  // 決済フロー: 支払い前に選択したプラン（決済完了後にinvitationに引き継ぎ）
  pendingPlanType: mysqlEnum("pendingPlanType", [
    "lover",
    "engagement",
    "student",
  ]),
  pendingPlanPaidAt: timestamp("pendingPlanPaidAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// partnerships テーブル
// ============================================================
export const partnerships = mysqlTable("partnerships", {
  id: int("id").autoincrement().primaryKey(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id").notNull(),

  status: mysqlEnum("status", [
    "green",    // 正常な交際中
    "engaged",  // 婚約中（独身証明書承認済み）
    "yellow",   // 一方が解消申請中（トラブル）
    "gray",     // 双方合意で解消待機中（クーリングオフ）
    "blue",     // 一方的解消処理中
    "white",    // 解消完了
  ])
    .default("green")
    .notNull(),

  // プラン種別
  planType: mysqlEnum("planType", [
    "lover",         // 恋人証明（6,600円/ペア）
    "engagement",    // 婚約証明（16,500円/ペア）
    "student",       // 学生割引（3,300円/ペア）
  ]).default("lover").notNull(),

  // ランク（交際月数ベース）
  currentRank: mysqlEnum("currentRank", [
    "bronze",      // 0〜2日
    "silver_3d",   // 3日〜
    "silver_1m",   // 1ヶ月〜
    "silver_3m",   // 3ヶ月〜
    "silver_6m",   // 6ヶ月〜
    "gold_10m",    // 10ヶ月〜
    "gold_12m",    // 12ヶ月〜
    "gold_15m",    // 15ヶ月〜
    "platinum_20m",// 20ヶ月〜
    "platinum_24m",// 24ヶ月〜
    "diamond_30m", // 30ヶ月〜
    "diamond_36m", // 36ヶ月〜
    "legend_40m",  // 40ヶ月〜
  ]).default("bronze").notNull(),

  rankUpdatedAt: timestamp("rankUpdatedAt"),
  nextRankAt: timestamp("nextRankAt"), // 次のランクアップ予定日

  // 年間更新
  renewalDueAt: timestamp("renewalDueAt"),
  lastRenewedAt: timestamp("lastRenewedAt"),
  renewalCount: int("renewalCount").default(0).notNull(),

  // OEM代理店経由
  oemAgencyId: int("oemAgencyId"),

  // 紹介者
  referredByUserId: int("referredByUserId"),

  // ブロックチェーン証明
  jAgreementRecordId: varchar("jAgreementRecordId", { length: 64 }), // j-agreement.com record_id (jar_xxx)
  blockchainTxHash: varchar("blockchainTxHash", { length: 255 }),
  blockchainBlockNumber: int("blockchainBlockNumber"),
  blockchainConfirmedAt: timestamp("blockchainConfirmedAt"),
  certificateUrl: text("certificateUrl"),
  blockchainRegisteredAt: timestamp("blockchainRegisteredAt"),

  // 解消関連
  dissolutionType: mysqlEnum("dissolutionType", ["mutual", "unilateral"]),
  dissolutionRequestedBy: int("dissolutionRequestedBy"),
  dissolutionConfirmedAt: timestamp("dissolutionConfirmedAt"),
  coolingOffEndsAt: timestamp("coolingOffEndsAt"),

  // カップル写真（スマホ証明書用）
  couplePhotoUrl: text("couplePhotoUrl"),

  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = typeof partnerships.$inferInsert;

// ============================================================
// partnership_status_history テーブル
// ============================================================
export const partnershipStatusHistory = mysqlTable(
  "partnership_status_history",
  {
    id: int("id").autoincrement().primaryKey(),
    partnershipId: int("partnershipId").notNull(),
    fromStatus: varchar("fromStatus", { length: 20 }),
    toStatus: varchar("toStatus", { length: 20 }).notNull(),
    changedBy: int("changedBy"),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

export type PartnershipStatusHistory =
  typeof partnershipStatusHistory.$inferSelect;

// ============================================================
// invitations テーブル
// ============================================================
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  inviterId: int("inviterId").notNull(),
  inviteeEmail: varchar("inviteeEmail", { length: 320 }),
  invitationKey: varchar("invitationKey", { length: 64 }).notNull().unique(),
  planType: mysqlEnum("planType", [
    "lover",
    "engagement",
    "student",
  ]).default("lover").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"])
    .default("pending")
    .notNull(),
  // 割り勘決済機能
  isSplitPayment: boolean("isSplitPayment").default(false).notNull(),
  inviterPaidAt: timestamp("inviterPaidAt"),
  accepterPaidAt: timestamp("accepterPaidAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

// ============================================================
// dissolution_requests テーブル
// ============================================================
export const dissolutionRequests = mysqlTable("dissolution_requests", {
  id: int("id").autoincrement().primaryKey(),
  partnershipId: int("partnershipId").notNull(),
  requestedBy: int("requestedBy").notNull(),
  type: mysqlEnum("type", ["mutual", "unilateral"]).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"])
    .default("pending")
    .notNull(),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DissolutionRequest = typeof dissolutionRequests.$inferSelect;
export type InsertDissolutionRequest =
  typeof dissolutionRequests.$inferInsert;

// ============================================================
// coin_transactions テーブル（コイン購入・消費履歴）
// ============================================================
export const coinTransactions = mysqlTable("coin_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "purchase",     // Stripeで購入
    "use",          // 証明書発行に使用
    "refund",       // 返金
    "bonus",        // キャンペーンボーナス
    "referral",     // 紹介報酬
  ]).notNull(),
  amount: int("amount").notNull(), // 正=加算, 負=減算
  balanceAfter: int("balanceAfter").notNull(),
  description: text("description"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  relatedPartnershipId: int("relatedPartnershipId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoinTransaction = typeof coinTransactions.$inferSelect;

// ============================================================
// oem_agencies テーブル（結婚相談所OEM代理店）
// ============================================================
export const oemAgencies = mysqlTable("oem_agencies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("50.00").notNull(), // %
  apiKey: varchar("apiKey", { length: 64 }).unique(), // OEM API連携用
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }), // カスタムブランドカラー
  isActive: boolean("isActive").default(true).notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // Stripe Connect
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalCommissionPaid: decimal("totalCommissionPaid", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OemAgency = typeof oemAgencies.$inferSelect;

// ============================================================
// referrals テーブル（紹介システム）
// ============================================================
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // 紹介した人
  refereeId: int("refereeId").notNull(),   // 紹介された人
  partnershipId: int("partnershipId"),     // 成立したパートナーシップ
  status: mysqlEnum("status", [
    "pending",    // 紹介済み・未成立
    "completed",  // パートナーシップ成立
    "rewarded",   // 報酬付与済み
  ]).default("pending").notNull(),
  rewardCoins: int("rewardCoins").default(0).notNull(), // 付与コイン数
  rewardedAt: timestamp("rewardedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;

// ============================================================
// physical_certificate_orders テーブル（証明書郵送・額装注文）
// ============================================================
export const physicalCertificateOrders = mysqlTable(
  "physical_certificate_orders",
  {
    id: int("id").autoincrement().primaryKey(),
    partnershipId: int("partnershipId").notNull(),
    orderedBy: int("orderedBy").notNull(),
    productType: mysqlEnum("productType", [
      "print_a4",       // A4印刷郵送 (1,500円)
      "frame_a4",       // A4額装 (5,000円)
      "frame_a3",       // A3額装プレミアム (12,000円)
      "digital_nft",    // デジタルNFT証明書 (3,000円)
    ]).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "paid",
      "printing",
      "shipped",
      "delivered",
      "cancelled",
    ]).default("pending").notNull(),

    // 配送先
    recipientName: varchar("recipientName", { length: 100 }),
    postalCode: varchar("postalCode", { length: 10 }),
    address: text("address"),
    phone: varchar("phone", { length: 20 }),

    // 決済
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    amountJpy: int("amountJpy").notNull(),

    // 配送
    trackingNumber: varchar("trackingNumber", { length: 100 }),
    shippedAt: timestamp("shippedAt"),
    deliveredAt: timestamp("deliveredAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type PhysicalCertificateOrder =
  typeof physicalCertificateOrders.$inferSelect;

// ============================================================
// affiliate_partners テーブル（タイアップ提携先）
// ============================================================
export const affiliatePartners = mysqlTable("affiliate_partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "movie",       // 映画館
    "restaurant",  // レストラン
    "jewelry",     // アクセサリー・ジュエリー
    "event",       // イベント
    "hotel",       // ホテル
    "travel",      // 旅行
    "other",       // その他
  ]).notNull(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  websiteUrl: text("websiteUrl"),
  discountDescription: text("discountDescription").notNull(), // 例: "映画チケット10%割引"
  discountCode: varchar("discountCode", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliatePartner = typeof affiliatePartners.$inferSelect;

// ============================================================
// sns_share_campaigns テーブル（SNSシェアキャンペーン）
// ============================================================
export const snsShareCampaigns = mysqlTable("sns_share_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  partnershipId: int("partnershipId").notNull(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", [
    "instagram",
    "tiktok",
    "facebook",
    "twitter",
    "line",
  ]).notNull(),
  shareUrl: text("shareUrl"), // シェアされたURL
  status: mysqlEnum("status", [
    "pending",    // シェア申請中
    "verified",   // 確認済み（無料適用）
    "rejected",   // 却下
  ]).default("pending").notNull(),
  rewardType: mysqlEnum("rewardType", [
    "free_certificate", // 証明書無料
    "coins",            // コイン付与
  ]).default("free_certificate").notNull(),
  rewardCoins: int("rewardCoins").default(0).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SnsShareCampaign = typeof snsShareCampaigns.$inferSelect;

// ============================================================
// payment_orders テーブル（Stripe決済記録）
// ============================================================
export const paymentOrders = mysqlTable("payment_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderType: mysqlEnum("orderType", [
    "partnership_lover",       // 恐人証明（6,600円/ペア）
    "partnership_engagement",  // 婚約証明（16,500円/ペア）
    "partnership_student",     // 学生割引（3,300円/ペア）
    "split_inviter",           // 割り勘（招待者半額）
    "split_accepter",          // 割り勘（承認者半額）
    "coin_purchase",           // コイン購入
    "renewal",                 // 年間更新
    "physical_certificate",    // 証明書郵送・額装
    "bank_transfer",           // 銀行振込
  ]).notNull(),
  amountJpy: int("amountJpy").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  status: mysqlEnum("status", [
    "pending",
    "completed",
    "failed",
    "refunded",
  ]).default("pending").notNull(),
  relatedPartnershipId: int("relatedPartnershipId"),
  coinsGranted: int("coinsGranted").default(0).notNull(),
  oemAgencyId: int("oemAgencyId"),
  commissionAmount: int("commissionAmount").default(0).notNull(), // 代理店手数料（円）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentOrder = typeof paymentOrders.$inferSelect;

// ============================================================
// push_subscriptions テーブル（Web Push通知購読）
// ============================================================
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// ============================================================
// notification_logs テーブル（節目プッシュ通知送信履歴）
// ============================================================
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  partnershipId: int("partnershipId").notNull(),
  userId: int("userId").notNull(),
  milestoneLabel: varchar("milestoneLabel", { length: 100 }).notNull(), // 例: "100日記念"
  milestoneDays: int("milestoneDays").notNull(),                         // 例: 100
  status: mysqlEnum("status", ["sent", "failed"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});
export type NotificationLog = typeof notificationLogs.$inferSelect;

// ============================================================
// partner_status_inquiries テーブル（パートナーステータス事前確認）
// ============================================================
export const partnerStatusInquiries = mysqlTable("partner_status_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  // 問い合わせを送った側
  requesterId: int("requesterId").notNull(),
  // 問い合わせ対象のメールアドレス（相手が登録済みかどうか問わず）
  targetEmail: varchar("targetEmail", { length: 320 }).notNull(),
  // 対象ユーザーID（登録済みユーザーが見つかった場合に設定）
  targetUserId: int("targetUserId"),
  // 確認用トークン（メールに含めて送付）
  token: varchar("token", { length: 64 }).notNull().unique(),
  // ステータス: pending=送信済み・未回答, consented=同意済み, declined=拒否, expired=期限切れ
  status: mysqlEnum("status", ["pending", "consented", "declined", "expired"])
    .default("pending")
    .notNull(),
  // 開示結果: single=シングル, yellow=イエロー（90日以内解消）, red=レッド（交際中）, not_registered=未登録
  result: mysqlEnum("result", ["single", "yellow", "red", "not_registered"]),
  // 有効期限（72時間）
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PartnerStatusInquiry = typeof partnerStatusInquiries.$inferSelect;
export type InsertPartnerStatusInquiry = typeof partnerStatusInquiries.$inferInsert;
