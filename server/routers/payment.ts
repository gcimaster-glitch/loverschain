import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  users,
  paymentOrders,
  coinTransactions,
  partnerships,
  physicalCertificateOrders,
  affiliatePartners,
  snsShareCampaigns,
  referrals,
  oemAgencies,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  PLAN_PRICES,
  RENEWAL_PRICE_PER_PERSON,
  COIN_TO_YEN,
  PHYSICAL_CERT_PRICES,
  DEFAULT_OEM_COMMISSION_RATE,
  REFERRAL_REWARD_COINS,
  calcRank,
  daysToNextRank,
  getRankDef,
  RANKS,
} from "../../shared/ranks";
import { nanoid } from "nanoid";

// STRIPE_SECRET_KEYが未設定の場合はダミー値で初期化（起動エラー回避）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_replace_with_real_key", {
  apiVersion: "2026-02-25.clover",
});

// ============================================================
// ランク計算ヘルパー
// ============================================================
async function updatePartnershipRank(partnershipId: number) {
  const db = await getDb();
  if (!db) return;
  const [p] = await db
    .select()
    .from(partnerships)
    .where(eq(partnerships.id, partnershipId))
    .limit(1);
  if (!p || p.status !== "green") return;

  const newRank = calcRank(p.startedAt);
  const { nextRank } = daysToNextRank(p.startedAt);
  const nextRankAt = nextRank
    ? new Date(p.startedAt.getTime() + nextRank.minDays * 24 * 60 * 60 * 1000)
    : null;

  await db
    .update(partnerships)
    .set({
      currentRank: newRank,
      rankUpdatedAt: new Date(),
      nextRankAt: nextRankAt ?? undefined,
    })
    .where(eq(partnerships.id, partnershipId));
}

// ============================================================
// コイン操作ヘルパー
// ============================================================
async function addCoins(
  userId: number,
  amount: number,
  type: "purchase" | "use" | "refund" | "bonus" | "referral",
  description: string,
  stripePaymentIntentId?: string,
  relatedPartnershipId?: number
) {
  const db = await getDb();
  if (!db) return;

  // 残高更新
  await db
    .update(users)
    .set({ coinBalance: sql`coinBalance + ${amount}` })
    .where(eq(users.id, userId));

  // 残高取得
  const [u] = await db.select({ coinBalance: users.coinBalance }).from(users).where(eq(users.id, userId)).limit(1);

  // 履歴記録
  await db.insert(coinTransactions).values({
    userId,
    type,
    amount,
    balanceAfter: u?.coinBalance ?? 0,
    description,
    stripePaymentIntentId,
    relatedPartnershipId,
  });
}

// ============================================================
// payment router
// ============================================================
export const paymentRouter = router({
  // ---- コイン残高取得 ----
  coinBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [u] = await db
      .select({ coinBalance: users.coinBalance })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return { balance: u?.coinBalance ?? 0 };
  }),

  // ---- コイン購入 Checkout Session ----
  createCoinCheckout: protectedProcedure
    .input(z.object({ coins: z.number().int().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const amountJpy = input.coins * COIN_TO_YEN;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: `恋人証明コイン × ${input.coins}`,
                description: `1コイン = ${COIN_TO_YEN}円。証明書発行にご利用いただけます。`,
              },
              unit_amount: amountJpy,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          order_type: "coin_purchase",
          coins: input.coins.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        allow_promotion_codes: true,
        success_url: `${ctx.req.headers.origin}/dashboard?payment=success`,
        cancel_url: `${ctx.req.headers.origin}/plans?payment=cancelled`,
      });

      // 注文記録
      const db = await getDb();
      if (db) {
        await db.insert(paymentOrders).values({
          userId: ctx.user.id,
          orderType: "coin_purchase",
          amountJpy,
          stripeCheckoutSessionId: session.id,
          status: "pending",
          coinsGranted: input.coins,
        });
      }

      return { url: session.url! };
    }),

  // ---- パートナーシップ発行 Checkout Session ----
  createPartnershipCheckout: protectedProcedure
    .input(
      z.object({
        planType: z.enum(["lover", "engagement", "student"]),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plan = PLAN_PRICES[input.planType];
      // ペアあたりの税込金額（招待者が全額支払い）
      const amountJpy = plan.pairPrice;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: `${plan.label}（ペア）`,
                description: `${plan.description}（税込）`,
              },
              unit_amount: amountJpy,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          order_type: `partnership_${input.planType}`,
          plan_type: input.planType,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        allow_promotion_codes: true,
        success_url: `${input.origin}/dashboard?payment=success&plan=${input.planType}`,
        cancel_url: `${input.origin}/plans?payment=cancelled`,
      });

      return { url: session.url! };
    }),

  // ---- 割り勘 Checkout Session (招待者半額支払い) ----
  createPartnershipSplitCheckout: protectedProcedure
    .input(
      z.object({
        planType: z.enum(["lover", "engagement", "student"]),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plan = PLAN_PRICES[input.planType];
      // 半額（招待者分）
      const halfAmountJpy = Math.ceil(plan.pairPrice / 2);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: `${plan.label}（割り勘・招待者分）`,
                description: `割り勘決済—招待者分（税込）`,
              },
              unit_amount: halfAmountJpy,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          order_type: "split_inviter",
          plan_type: input.planType,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        allow_promotion_codes: true,
        success_url: `${input.origin}/dashboard?payment=success&plan=${input.planType}&split=inviter`,
        cancel_url: `${input.origin}/plans?payment=cancelled`,
      });
      return { url: session.url! };
    }),

  // ---- 割り勘 Checkout Session (承認者半額支払い) ----
  createSplitAccepterCheckout: protectedProcedure
    .input(
      z.object({
        invitationKey: z.string(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { invitations } = await import("../../drizzle/schema");
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.invitationKey, input.invitationKey))
        .limit(1);
      if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "招待情報が見つかりません" });
      if (!invitation.isSplitPayment) throw new TRPCError({ code: "BAD_REQUEST", message: "割り勘招待ではありません" });
      if (invitation.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "この招待は既に使用済みまたは期限切れです" });
      if (invitation.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "招待リンクの有効期限が切れています" });
      const plan = PLAN_PRICES[invitation.planType];
      const halfAmountJpy = Math.ceil(plan.pairPrice / 2);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: `${plan.label}（割り勘・承認者分）`,
                description: `割り勘決済—承認者分（税込）`,
              },
              unit_amount: halfAmountJpy,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          order_type: "split_accepter",
          plan_type: invitation.planType,
          invitation_key: input.invitationKey,
          inviter_id: invitation.inviterId.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        allow_promotion_codes: true,
        success_url: `${input.origin}/invite/${input.invitationKey}?split_paid=true`,
        cancel_url: `${input.origin}/invite/${input.invitationKey}?payment=cancelled`,
      });
      return { url: session.url! };
    }),

  // ---- 年間更新 Checkout Session ----
  createRenewalCheckout: protectedProcedure
    .input(z.object({ partnershipId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const amountJpy = RENEWAL_PRICE_PER_PERSON;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: "恋人証明 年間更新",
                description: `パートナーシップID: KS-${String(input.partnershipId).padStart(8, "0")}`,
              },
              unit_amount: amountJpy,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          order_type: "renewal",
          partnership_id: input.partnershipId.toString(),
          customer_email: ctx.user.email ?? "",
        },
        allow_promotion_codes: true,
        success_url: `${ctx.req.headers.origin}/dashboard?renewal=success`,
        cancel_url: `${ctx.req.headers.origin}/dashboard?renewal=cancelled`,
      });

      return { url: session.url! };
    }),

  // ---- 物理証明書注文 Checkout Session ----
  createPhysicalCertCheckout: protectedProcedure
    .input(
      z.object({
        partnershipId: z.number().int(),
        productType: z.enum(["print_a4", "frame_a4", "frame_a3", "digital_nft"]),
        recipientName: z.string().max(100),
        postalCode: z.string().max(10).optional(),
        address: z.string().optional(),
        phone: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const amountJpy = PHYSICAL_CERT_PRICES[input.productType];
      const productLabels = {
        print_a4: "A4印刷郵送",
        frame_a4: "A4額装",
        frame_a3: "A3額装プレミアム",
        digital_nft: "デジタルNFT証明書",
      };

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: `恋人証明書 ${productLabels[input.productType]}`,
                description: `KS-${String(input.partnershipId).padStart(8, "0")} の証明書`,
              },
              unit_amount: amountJpy,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          order_type: "physical_certificate",
          partnership_id: input.partnershipId.toString(),
          product_type: input.productType,
          recipient_name: input.recipientName,
          postal_code: input.postalCode ?? "",
          address: input.address ?? "",
          phone: input.phone ?? "",
          customer_email: ctx.user.email ?? "",
        },
        allow_promotion_codes: true,
        success_url: `${ctx.req.headers.origin}/dashboard?order=success`,
        cancel_url: `${ctx.req.headers.origin}/certificate/${input.partnershipId}?order=cancelled`,
      });

      // 注文記録
      const db = await getDb();
      if (db) {
        await db.insert(physicalCertificateOrders).values({
          partnershipId: input.partnershipId,
          orderedBy: ctx.user.id,
          productType: input.productType,
          recipientName: input.recipientName,
          postalCode: input.postalCode,
          address: input.address,
          phone: input.phone,
          amountJpy,
          stripePaymentIntentId: session.payment_intent as string,
          status: "pending",
        });
      }

      return { url: session.url! };
    }),

  // ---- ランク情報取得 ----
  rankInfo: protectedProcedure
    .input(z.object({ partnershipId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [p] = await db
        .select()
        .from(partnerships)
        .where(
          and(
            eq(partnerships.id, input.partnershipId),
            sql`(user1Id = ${ctx.user.id} OR user2Id = ${ctx.user.id})`
          )
        )
        .limit(1);

      if (!p) throw new TRPCError({ code: "NOT_FOUND" });

      // ランク更新
      await updatePartnershipRank(input.partnershipId);

      const rank = calcRank(p.startedAt);
      const rankDef = getRankDef(rank);
      const { nextRank, daysLeft } = daysToNextRank(p.startedAt);
      const totalDays = Math.floor(
        (Date.now() - p.startedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        partnershipId: p.id,
        currentRank: rankDef,
        totalDays,
        nextRank: nextRank ?? null,
        daysToNextRank: daysLeft,
        renewalCount: p.renewalCount,
        renewalDueAt: p.renewalDueAt,
        allRanks: RANKS,
      };
    }),

  // ---- タイアップ特典一覧 ----
  affiliateList: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { partners: [] };
    const partners = await db
      .select()
      .from(affiliatePartners)
      .where(eq(affiliatePartners.isActive, true))
      .orderBy(affiliatePartners.sortOrder);
    return { partners };
  }),

  // ---- SNSシェアキャンペーン申請 ----
  submitSnsShare: protectedProcedure
    .input(
      z.object({
        partnershipId: z.number().int(),
        platform: z.enum(["instagram", "tiktok", "facebook", "twitter", "line"]),
        shareUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(snsShareCampaigns).values({
        partnershipId: input.partnershipId,
        userId: ctx.user.id,
        platform: input.platform,
        shareUrl: input.shareUrl,
        status: "pending",
        rewardType: "free_certificate",
      });

      return { success: true, message: "シェア申請を受け付けました。審査後に特典が付与されます。" };
    }),

  // ---- 紹介コード生成 ----
  getOrCreateReferralCode: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [u] = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (u?.referralCode) return { code: u.referralCode };

    // 新規生成
    const code = `KS${nanoid(8).toUpperCase()}`;
    await db
      .update(users)
      .set({ referralCode: code })
      .where(eq(users.id, ctx.user.id));

    return { code };
  }),

  // ---- 紹介履歴 ----
  referralHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { referrals: [], totalRewardCoins: 0 };
    const rows = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(desc(referrals.createdAt));
    const totalRewardCoins = rows.reduce((sum, r) => sum + r.rewardCoins, 0);
    return { referrals: rows, totalRewardCoins };
  }),

  // ---- コイン取引履歴 ----
  coinHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { transactions: [] };
    const transactions = await db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, ctx.user.id))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(50);
    return { transactions };
  }),

  // ---- OEM代理店一覧（管理者用） ----
  adminOemList: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { agencies: [] };
    const agencies = await db.select().from(oemAgencies).orderBy(desc(oemAgencies.createdAt));
    return { agencies };
  }),

  // ---- OEM代理店作成（管理者用） ----
  adminCreateOem: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        commissionRate: z.number().min(0).max(100).default(DEFAULT_OEM_COMMISSION_RATE),
        primaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const apiKey = `oem_${nanoid(32)}`;
      await db.insert(oemAgencies).values({
        name: input.name,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        commissionRate: String(input.commissionRate),
        apiKey,
        primaryColor: input.primaryColor,
      });

      return { success: true, apiKey };
    }),

  // ---- タイアップ提携先作成（管理者用） ----
  adminCreateAffiliate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        category: z.enum(["movie", "restaurant", "jewelry", "event", "hotel", "travel", "other"]),
        description: z.string().optional(),
        websiteUrl: z.string().url().optional(),
        discountDescription: z.string().min(1),
        discountCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(affiliatePartners).values({
        name: input.name,
        category: input.category,
        description: input.description,
        websiteUrl: input.websiteUrl,
        discountDescription: input.discountDescription,
        discountCode: input.discountCode,
      });

      return { success: true };
    }),

  // ---- SNSシェア審査（管理者用） ----
  adminReviewSnsShare: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().int(),
        status: z.enum(["verified", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [campaign] = await db
        .select()
        .from(snsShareCampaigns)
        .where(eq(snsShareCampaigns.id, input.campaignId))
        .limit(1);

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(snsShareCampaigns)
        .set({
          status: input.status,
          verifiedAt: input.status === "verified" ? new Date() : undefined,
        })
        .where(eq(snsShareCampaigns.id, input.campaignId));

      // 承認時: コイン付与
      if (input.status === "verified" && campaign.rewardType === "coins") {
        await addCoins(
          campaign.userId,
          campaign.rewardCoins,
          "bonus",
          `SNSシェアキャンペーン報酬 (${campaign.platform})`,
        );
      }

      return { success: true };
    }),

  // ---- サブスクリプション情報取得 ----
  subscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !user.stripeCustomerId) {
      // Stripe未設定または未登録の場合はモックデータを返す
      return {
        hasSubscription: false,
        planName: "標準プラン",
        status: "inactive" as const,
        currentPeriodEnd: null as Date | null,
        cancelAtPeriodEnd: false,
      };
    }

    try {
      // Stripe APIでサブスクリプションを取得
      const response = await fetch(
        `https://api.stripe.com/v1/subscriptions?customer=${user.stripeCustomerId}&status=active&limit=1`,
        {
          headers: { Authorization: `Bearer ${stripeKey}` },
        }
      );
      if (!response.ok) throw new Error("Stripe API error");
      const data = await response.json() as { data: Array<{
        id: string;
        status: string;
        current_period_end: number;
        cancel_at_period_end: boolean;
        items: { data: Array<{ price: { product: string; nickname: string | null; unit_amount: number | null } }> };
      }> };

      if (!data.data || data.data.length === 0) {
        return {
          hasSubscription: false,
          planName: "標準プラン",
          status: "inactive" as const,
          currentPeriodEnd: null as Date | null,
          cancelAtPeriodEnd: false,
        };
      }

      const sub = data.data[0];
      const price = sub.items.data[0]?.price;
      const planName = price?.nickname ?? (
        price?.unit_amount ? `標準プラン (月額${price.unit_amount.toLocaleString()}円)` : "標準プラン"
      );

      return {
        hasSubscription: true,
        planName,
        status: sub.status as "active" | "past_due" | "canceled",
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    } catch (e) {
      console.error("[Stripe] subscriptionStatus error:", e);
      return {
        hasSubscription: false,
        planName: "標準プラン",
        status: "inactive" as const,
        currentPeriodEnd: null as Date | null,
        cancelAtPeriodEnd: false,
      };
    }
  }),

  // ---- Stripeカスタマーポータルセッション生成（解約・プラン変更用） ----
  createPortalSession: protectedProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Stripeはまだ設定されていません。" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        // カスタマーがない場合は作成
        const res = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ email: user.email ?? "", name: user.name ?? "" }).toString(),
        });
        if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripeカスタマー作成に失敗しました。" });
        const customer = await res.json() as { id: string };
        customerId = customer.id;
        await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, ctx.user.id));
      }

      const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: customerId,
          return_url: input.returnUrl,
        }).toString(),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[Stripe] portal session error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripeポータルの起動に失敗しました。" });
      }
      const session = await res.json() as { url: string };
      return { url: session.url };
    }),

  // ---- サブスクリプション開始 Checkout Session ----
  createSubscriptionCheckout: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const priceId = process.env.STRIPE_PRICE_ID;
      if (!priceId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "STRIPE_PRICE_IDが設定されていません" });

      // 既存サブスクリプション確認
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // Stripe Customer IDを取得または作成
      let customerId = user.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.displayName ?? undefined,
          metadata: { user_id: String(user.id) },
        });
        customerId = customer.id;
        await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${input.origin}/dashboard?subscription=success`,
        cancel_url: `${input.origin}/plans?subscription=cancelled`,
        client_reference_id: String(user.id),
        metadata: {
          user_id: String(user.id),
          customer_email: user.email ?? "",
          customer_name: user.displayName ?? "",
          order_type: "subscription",
        },
      });

      return { url: session.url };
    }),

  // ---- 収益統計（管理者用） ----
  adminRevenueStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { totalRevenue: 0, totalOrders: 0, byType: [] };

    const orders = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.status, "completed"));

    const totalRevenue = orders.reduce((sum, o) => sum + o.amountJpy, 0);
    const totalOrders = orders.length;

    const byType: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      if (!byType[o.orderType]) byType[o.orderType] = { count: 0, revenue: 0 };
      byType[o.orderType].count++;
      byType[o.orderType].revenue += o.amountJpy;
    }

    return {
      totalRevenue,
      totalOrders,
      byType: Object.entries(byType).map(([type, data]) => ({ type, ...data })),
    };
  }),
});
