import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  savePushSubscription,
  removePushSubscription,
  getPushSubscriptionCount,
} from "../push";
import { ENV } from "../_core/env";

export const notificationRouter = router({
  // ─── VAPID公開鍵を返す（フロントエンドのService Worker登録に使用）
  getVapidPublicKey: protectedProcedure.query(() => {
    return { publicKey: ENV.vapidPublicKey };
  }),

  // ─── Push購読を登録する
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userAgent = (ctx.req.headers["user-agent"] as string) ?? undefined;
      await savePushSubscription(ctx.user.id, input, userAgent);
      return { success: true };
    }),

  // ─── Push購読を解除する
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      await removePushSubscription(input.endpoint);
      return { success: true };
    }),

  // ─── 購読状態を確認する（購読数を返す）
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const count = await getPushSubscriptionCount(ctx.user.id);
    return {
      isSubscribed: count > 0,
      subscriptionCount: count,
      vapidConfigured: Boolean(ENV.vapidPublicKey && ENV.vapidPrivateKey),
    };
  }),
});
