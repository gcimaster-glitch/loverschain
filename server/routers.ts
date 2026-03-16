import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { userRouter } from "./routers/user";
import { invitationRouter } from "./routers/invitation";
import { partnershipRouter } from "./routers/partnership";
import { paymentRouter } from "./routers/payment";
import { notificationRouter } from "./routers/notification";
import { adminRouter } from "./routers/admin";
import { partnerStatusRouter } from "./routers/partnerStatus";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  user: userRouter,
  invitation: invitationRouter,
  partnership: partnershipRouter,
  payment: paymentRouter,
  notification: notificationRouter,
  admin: adminRouter,
  partnerStatus: partnerStatusRouter,
});

export type AppRouter = typeof appRouter;
