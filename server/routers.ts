import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  developers: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().optional().default(100),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        const { getAllDevelopers } = await import("./developerDb");
        return await getAllDevelopers(input.limit, input.offset);
      }),

    getByWallet: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        const { getDeveloperByWallet } = await import("./developerDb");
        return await getDeveloperByWallet(input.walletAddress);
      }),

    getProfile: publicProcedure
      .input(z.object({ developerId: z.number() }))
      .query(async ({ input }) => {
        const { getDeveloperProfile } = await import("./developerDb");
        return await getDeveloperProfile(input.developerId);
      }),

    search: publicProcedure
      .input(
        z.object({
          query: z.string(),
          limit: z.number().optional().default(20),
        })
      )
      .query(async ({ input }) => {
        const { searchDevelopers } = await import("./developerDb");
        return await searchDevelopers(input.query, input.limit);
      }),
  }),

  tokens: router({
    getByDeveloper: publicProcedure
      .input(z.object({ developerId: z.number() }))
      .query(async ({ input }) => {
        const { getTokensByDeveloper } = await import("./developerDb");
        return await getTokensByDeveloper(input.developerId);
      }),

    getByAddress: publicProcedure
      .input(z.object({ tokenAddress: z.string() }))
      .query(async ({ input }) => {
        const { getTokenByAddress } = await import("./developerDb");
        return await getTokenByAddress(input.tokenAddress);
      }),
  }),

  notifications: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getUserNotifications } = await import("./developerDb");
        return await getUserNotifications(ctx.user.id, input.limit);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        const { markNotificationAsRead } = await import("./developerDb");
        await markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    subscribe: protectedProcedure
      .input(
        z.object({
          developerId: z.number(),
          notifyOnLaunch: z.boolean().optional().default(true),
          notifyOnMigration: z.boolean().optional().default(true),
          notifyOnSuspicious: z.boolean().optional().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createNotificationSubscription } = await import("./developerDb");
        await createNotificationSubscription({
          userId: ctx.user.id,
          developerId: input.developerId,
          notifyOnLaunch: input.notifyOnLaunch ? 1 : 0,
          notifyOnMigration: input.notifyOnMigration ? 1 : 0,
          notifyOnSuspicious: input.notifyOnSuspicious ? 1 : 0,
        });
        return { success: true };
      }),

    getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      const { getNotificationSubscriptions } = await import("./developerDb");
      return await getNotificationSubscriptions(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
