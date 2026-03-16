import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

// ─── VAPID初期化 ─────────────────────────────────────────────────
let initialized = false;

function ensureVapidInitialized() {
  if (initialized) return;
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured, push notifications disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:support@loverschain.jp",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
  initialized = true;
}

// ─── 通知ペイロード型 ─────────────────────────────────────────────
export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
};

// ─── ユーザーへのプッシュ通知送信 ─────────────────────────────────
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  ensureVapidInitialized();
  if (!initialized) return { sent: 0, failed: 0 };

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icon-192.png",
    badge: payload.badge ?? "/icon-72.png",
    url: payload.url ?? "/dashboard",
    tag: payload.tag ?? "koibito-notification",
  });

  let sent = 0;
  let failed = 0;
  const expiredIds: number[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub: typeof pushSubscriptions.$inferSelect) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(sub.id);
        }
        failed++;
        console.warn(`[Push] Failed to send to user ${userId}:`, statusCode);
      }
    })
  );

  // 期限切れ購読を削除
  if (expiredIds.length > 0) {
    const db2 = await getDb();
    if (db2) {
      await Promise.allSettled(
        expiredIds.map((id) =>
          db2.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))
        )
      );
    }
  }

  return { sent, failed };
}

// ─── 購読登録 ─────────────────────────────────────────────────────
export async function savePushSubscription(
  userId: number,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      })
      .where(eq(pushSubscriptions.id, existing[0].id));
  } else {
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null,
    });
  }
}

// ─── 購読解除 ─────────────────────────────────────────────────────
export async function removePushSubscription(
  endpoint: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

// ─── ユーザーの購読数取得 ─────────────────────────────────────────
export async function getPushSubscriptionCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const subs = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  return subs.length;
}
