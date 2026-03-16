import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import { getDb, updateUserKycStatus, getUserById, createInvitation, getActivePartnershipByUserId } from "./db";
import { nanoid } from "nanoid";
import {
  users,
  paymentOrders,
  partnerships,
  coinTransactions,
  physicalCertificateOrders,
} from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { sendPushToUser } from "./push";
import { invitationEmailHtml, kycRejectedEmailHtml } from "./emailTemplates";

// ドメイン認証完了後は RESEND_FROM_ADDRESS="恋人証明 <noreply@loverschain.jp>" を環境変数に設定する
const WEBHOOK_FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "恋人証明 <onboarding@resend.dev>";

// STRIPE_SECRET_KEYが未設定の場合はダミー値で初期化（起動エラー回避）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_replace_with_real_key", {
  apiVersion: "2026-02-25.clover",
});

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

  await db
    .update(users)
    .set({ coinBalance: sql`coinBalance + ${amount}` })
    .where(eq(users.id, userId));

  const [u] = await db
    .select({ coinBalance: users.coinBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

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

export function registerStripeWebhook(app: Express) {
  // IMPORTANT: raw body must be parsed BEFORE express.json()
  app.post(
    "/api/stripe/webhook",
    // express.raw is applied inline here
    (req: Request, res: Response, next) => {
      // Already parsed by express.raw in index.ts? No — we need raw body.
      // We'll use the rawBody trick via express.raw middleware
      next();
    }
  );
}

// 本番ドメイン（loverschain.jp）用のWebhook Secret
// Stripeダッシュボードでloverschain.jpのWebhookを新規作成した際に発行された値
const PRODUCTION_WEBHOOK_SECRET = "whsec_LpbFZ0MxArWVrHlWui9m0SZlFR3IwZDK";

// This function is called from index.ts with express.raw middleware
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  // 本番ドメインとManus内部URLの両方のWebhookを受け付けるため、両方のSecretで検証を試みる
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    PRODUCTION_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];

  let event: Stripe.Event | null = null;

  if (!sig || secrets.length === 0) {
    console.warn("[Stripe Webhook] Missing secret or signature");
    return res.status(400).json({ error: "Missing webhook secret" });
  }

  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
      break; // 検証成功
    } catch {
      // 次のSecretで再試行
    }
  }

  if (!event) {
    console.error("[Stripe Webhook] Signature verification failed with all secrets");
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  // Test event handling (required for webhook verification)
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};
      const userId = parseInt(metadata.user_id ?? "0");
      const orderType = metadata.order_type ?? "";

      if (!userId) {
        console.warn("[Stripe Webhook] No user_id in metadata");
        return res.json({ received: true });
      }

      const db = await getDb();
      if (!db) return res.json({ received: true });

      // 注文ステータス更新
      if (session.id) {
        await db
          .update(paymentOrders)
          .set({
            status: "completed",
            stripePaymentIntentId: session.payment_intent as string,
          })
          .where(eq(paymentOrders.stripeCheckoutSessionId, session.id));
      }

      // コイン購入
      if (orderType === "coin_purchase") {
        const coins = parseInt(metadata.coins ?? "0");
        if (coins > 0) {
          await addCoins(
            userId,
            coins,
            "purchase",
            `コイン購入 × ${coins}`,
            session.payment_intent as string
          );
          console.log(`[Stripe Webhook] Granted ${coins} coins to user ${userId}`);
        }
      }

      // 年間更新
      if (orderType === "renewal") {
        const partnershipId = parseInt(metadata.partnership_id ?? "0");
        if (partnershipId) {
          const renewalDueAt = new Date();
          renewalDueAt.setFullYear(renewalDueAt.getFullYear() + 1);
          await db
            .update(partnerships)
            .set({
              renewalDueAt,
              lastRenewedAt: new Date(),
              renewalCount: sql`renewalCount + 1`,
            })
            .where(eq(partnerships.id, partnershipId));
          console.log(`[Stripe Webhook] Renewed partnership ${partnershipId}`);
        }
      }

      // 物理証明書注文
      if (orderType === "physical_certificate") {
        const partnershipId = parseInt(metadata.partnership_id ?? "0");
        if (partnershipId) {
          await db
            .update(physicalCertificateOrders)
            .set({ status: "paid" })
            .where(
              eq(physicalCertificateOrders.partnershipId, partnershipId)
            );
        }
      }

      // パートナーシップ決済完了: pendingPlanTypeを設定（招待リンク発行を解禁）
      if (
        orderType === "partnership_lover" ||
        orderType === "partnership_engagement" ||
        orderType === "partnership_student"
      ) {
        // plan_typeメタデータがない場合は、order_typeから抽出（下位互換性）
        const planType = (metadata.plan_type || orderType.replace("partnership_", "")) as "lover" | "engagement" | "student";
        const amountJpy = session.amount_total ?? 0;
        // payment_ordersにレコードを新規作成（または既存を更新）
        const existingOrders = await db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.stripeCheckoutSessionId, session.id))
          .limit(1);
        if (existingOrders.length === 0) {
          // 新規作成
          await db.insert(paymentOrders).values({
            userId,
            orderType: orderType as "partnership_lover" | "partnership_engagement" | "partnership_student",
            amountJpy,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string ?? undefined,
            status: "completed",
          });
        }
        // ユーザーのpendingPlanTypeを設定（招待リンク発行を解禁）
        await db
          .update(users)
          .set({
            pendingPlanType: planType,
            pendingPlanPaidAt: new Date(),
          })
          .where(eq(users.id, userId));
        console.log(`[Stripe Webhook] Partnership payment completed for user ${userId}, plan: ${planType}`);
      }

      // 割り勘: 招待者半額支払い完了 → pendingPlanTypeを設定してisSplitPayment招待リンクを発行
      if (orderType === "split_inviter") {
        const planType = metadata.plan_type as "lover" | "engagement" | "student";
        const amountJpy = session.amount_total ?? 0;
        // payment_ordersにレコードを新規作成
        const existingOrders = await db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.stripeCheckoutSessionId, session.id))
          .limit(1);
        if (existingOrders.length === 0) {
          await db.insert(paymentOrders).values({
            userId,
            orderType: "split_inviter",
            amountJpy,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string ?? undefined,
            status: "completed",
          });
        }
        // ユーザーのpendingPlanTypeを設定（割り勘フラグ付き招待リンク発行を解禁）
        await db
          .update(users)
          .set({
            pendingPlanType: planType,
            pendingPlanPaidAt: new Date(),
          })
          .where(eq(users.id, userId));
        console.log(`[Stripe Webhook] Split inviter payment completed for user ${userId}, plan: ${planType}`);
      }

      // 割り勘: 承認者半額支払い完了 → invitationsのaccepterPaidAtを設定してパートナーシップ成立
      if (orderType === "split_accepter") {
        const invitationKey = metadata.invitation_key;
        const inviterId = parseInt(metadata.inviter_id ?? "0");
        const planType = metadata.plan_type as "lover" | "engagement" | "student";
        const amountJpy = session.amount_total ?? 0;
        if (invitationKey) {
          const { invitations } = await import("../drizzle/schema");
          // payment_ordersにレコードを新規作成
          const existingOrders = await db
            .select()
            .from(paymentOrders)
            .where(eq(paymentOrders.stripeCheckoutSessionId, session.id))
            .limit(1);
          if (existingOrders.length === 0) {
            await db.insert(paymentOrders).values({
              userId,
              orderType: "split_accepter",
              amountJpy,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string ?? undefined,
              status: "completed",
            });
          }
          // invitationsのaccepterPaidAtを設定
          await db
            .update(invitations)
            .set({ accepterPaidAt: new Date() })
            .where(eq(invitations.invitationKey, invitationKey));
          console.log(`[Stripe Webhook] Split accepter payment completed for user ${userId}, invitation: ${invitationKey}`);
          // 招待者にプッシュ通知
          if (inviterId) {
            await sendPushToUser(inviterId, {
              title: "パートナーが割り勘支払いを完了しました 🎉",
              body: "パートナーシップが成立しました！ダッシュボードを確認してください。",
              url: "/dashboard",
            }).catch((e: unknown) => console.warn("[Stripe Webhook] Push failed:", e));
          }
        }
      }

      // stripeCustomerIdをユーザーに保存（サブスクリプション購入時に必要）
      if (session.customer && userId) {
        await db
          .update(users)
          .set({ stripeCustomerId: session.customer as string })
          .where(eq(users.id, userId));
        console.log(`[Stripe Webhook] Saved stripeCustomerId for user ${userId}`);
      }
    }

    // サブスクリプション作成時: stripeCustomerIdをDBに保存 + プッシュ通知
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
      console.log(`[Stripe Webhook] Subscription created: ${subscription.id} for customer ${customerId}`);
      if (customerId) {
        const db = await getDb();
        if (db) {
          // stripeCustomerIdでユーザーを特定してプッシュ通知
          const [userRow] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
          if (userRow) {
            await sendPushToUser(userRow.id, {
              title: "サブスクリプションが有効になりました 🎉",
              body: "恋人証明プレミアムプランへようこそ！招待リンクを発行できます。",
              url: "/dashboard",
            }).catch((e: unknown) => console.warn("[Stripe Webhook] Push failed:", e));
            console.log(`[Stripe Webhook] Sent subscription activation push to user ${userRow.id}`);
          }
        }
      }
    }

    // サブスクリプション解約時: プッシュ通知
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
      console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id} for customer ${customerId}`);
      if (customerId) {
        const db = await getDb();
        if (db) {
          const [userRow] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
          if (userRow) {
            await sendPushToUser(userRow.id, {
              title: "サブスクリプションが解約されました",
              body: "プレミアムプランが終了しました。再度ご利用の場合はプランページからお申し込みください。",
              url: "/plans",
            }).catch((e: unknown) => console.warn("[Stripe Webhook] Push failed:", e));
          }
        }
      }
    }

    // 請求支払い完了時: ログ記録
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice paid: ${invoice.id} for customer ${invoice.customer}`);
    }

    // ─── Stripe Identity: eKYC自動承認 ───────────────────────────────────────

    // 本人確認完了: kycStatusをverifiedに自動更新
    if (event.type === "identity.verification_session.verified") {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
      if (!userId) {
        console.warn("[KYC Webhook] No user_id in metadata for session:", session.id);
      } else {
        const user = await getUserById(userId);
        if (user && user.kycStatus !== "verified") {
          await updateUserKycStatus(userId, "verified", session.id, null);
          console.log(`[KYC Webhook] Auto-verified user ${userId} via session ${session.id}`);
          // プッシュ通知: 本人確認完了
          await sendPushToUser(userId, {
            title: "本人確認が完了しました ✅",
            body: "恋人証明の本人確認が承認されました。パートナーへの招待を開始できます。",
            url: "/dashboard",
          }).catch((e: unknown) => console.warn("[KYC Webhook] Push failed:", e));

          // 決済済み・未パートナーシップの場合、自動招待リンクをメール送信
          if (user.pendingPlanPaidAt && user.pendingPlanType && user.email) {
            const existingPartnership = await getActivePartnershipByUserId(userId);
            if (!existingPartnership) {
              try {
                const invitationKey = nanoid(24);
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                await createInvitation({
                  inviterId: userId,
                  invitationKey,
                  planType: user.pendingPlanType as "lover" | "engagement" | "student",
                  expiresAt,
                });
                const origin = process.env.VITE_OAUTH_PORTAL_URL
                  ? "https://loverschain.jp"
                  : "https://loverschain.jp";
                const inviteUrl = `${origin}/invite/${invitationKey}`;
                if (process.env.RESEND_API_KEY) {
                  const planLabels: Record<string, string> = {
                    lover: "恋人プラン",
                    engagement: "婚約プラン",
                    student: "学生プラン",
                  };
                  const planName = planLabels[user.pendingPlanType ?? ""] ?? "恋人プラン";
                  await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      from: WEBHOOK_FROM_ADDRESS,
                      to: user.email,
                      subject: "💕 本人確認が完了しました！パートナーへの招待リンクをお送りします",
                      html: invitationEmailHtml({
                        userName: user.name ?? "お客様",
                        inviteUrl,
                        planName,
                      }),
                    }),
                  });
                  console.log(`[KYC Webhook] Auto-sent invitation email to user ${userId}`);
                }
              } catch (err) {
                console.error(`[KYC Webhook] Failed to auto-create invitation for user ${userId}:`, err);
              }
            }
          }
        } else if (user?.kycStatus === "verified") {
          console.log(`[KYC Webhook] User ${userId} already verified, skipping`);
        } else {
          console.warn(`[KYC Webhook] User ${userId} not found`);
        }
      }
    }

    // 書類提出・審査開始: プッシュ通知のみ（DB更新不要）
    if (event.type === "identity.verification_session.processing") {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
      if (userId) {
        console.log(`[KYC Webhook] Verification processing started for user ${userId}, session ${session.id}`);
        await sendPushToUser(userId, {
          title: "書類を受け付けました 📋",
          body: "本人確認の審査を開始しました。通常数分で完了します。結果をお知らせします。",
          url: "/kyc",
        }).catch((e: unknown) => console.warn("[KYC Webhook] Push failed:", e));
      }
    }

    // 本人確認失敗（再入力が必要）: kycStatusをfailedに更新
    if (event.type === "identity.verification_session.requires_input") {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
      if (userId) {
        const errorCode = session.last_error?.code ?? null;
        await updateUserKycStatus(userId, "failed", session.id, errorCode);
        console.log(`[KYC Webhook] Verification requires_input for user ${userId}, error: ${errorCode}`);

        // エラーコード別のメッセージを生成
        const { getKycErrorMessage } = await import("../shared/kycErrors");
        const errMsg = getKycErrorMessage(errorCode);

        // プッシュ通知: 本人確認失敗（エラーコード別メッセージ）
        await sendPushToUser(userId, {
          title: `本人確認が不合格でした: ${errMsg.title}`,
          body: `${errMsg.detail}　「今すぐ再申請」から再度お試しください。`,
          url: "/kyc",
          tag: "kyc-failed",
        }).catch((e: unknown) => console.warn("[KYC Webhook] Push failed:", e));

        // 却下メール送信
        const user = await getUserById(userId);
        if (user?.email && process.env.RESEND_API_KEY) {
          const kycUrl = "https://loverschain.jp/kyc";
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: WEBHOOK_FROM_ADDRESS,
              to: user.email,
              subject: "⚠️ 本人確認を再度お試しください",
              html: kycRejectedEmailHtml({
                userName: user.name ?? "お客様",
                errorTitle: errMsg.title,
                errorDetail: errMsg.detail,
                kycUrl,
              }),
            }),
          }).catch((e: unknown) => console.warn("[KYC Webhook] Rejection email failed:", e));
          console.log(`[KYC Webhook] Sent rejection email to user ${userId}`);
        }
      }
    }

    // 本人確認キャンセル: kycStatusをnot_startedに戺す + プッシュ通知
    if (event.type === "identity.verification_session.canceled") {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
      if (userId) {
        const user = await getUserById(userId);
        // pending状態のみnot_startedに戺す（verifiedは維持）
        if (user && user.kycStatus === "pending") {
          await updateUserKycStatus(userId, "not_started", undefined, null);
          console.log(`[KYC Webhook] Session canceled for user ${userId}, reset to not_started`);
          // プッシュ通知: キャンセル通知
          await sendPushToUser(userId, {
            title: "本人確認がキャンセルされました",
            body: "本人確認がキャンセルされました。再度お試しください。",
            url: "/kyc",
          }).catch((e: unknown) => console.warn("[KYC Webhook] Push failed:", e));
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}
