import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import {
  addGolfScore,
  deleteGolfScore,
  getAllCharities,
  getActiveSubscribers,
  getCharityById,
  getSubscription,
  getUserCharity,
  getUserScores,
  setUserCharity,
  updateGolfScore,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Golf Score Router
  scores: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const scores = await getUserScores(ctx.user.id);
      return scores;
    }),
    add: protectedProcedure
      .input(
        z.object({
          score: z.number().min(1).max(45),
          scoreDate: z.date(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addGolfScore(ctx.user.id, input.score, input.scoreDate);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          scoreId: z.number(),
          score: z.number().min(1).max(45),
        })
      )
      .mutation(async ({ input }) => {
        await updateGolfScore(input.scoreId, input.score);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ scoreId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGolfScore(input.scoreId);
        return { success: true };
      }),
  }),

  // Charity Router
  charities: router({
    list: publicProcedure.query(async () => {
      return await getAllCharities();
    }),
    getById: publicProcedure
      .input(z.object({ charityId: z.number() }))
      .query(async ({ input }) => {
        return await getCharityById(input.charityId);
      }),
    setUserCharity: protectedProcedure
      .input(
        z.object({
          charityId: z.number(),
          contributionPercentage: z.number().min(10).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await setUserCharity(
          ctx.user.id,
          input.charityId,
          input.contributionPercentage
        );
        return { success: true };
      }),
    getUserCharity: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCharity(ctx.user.id);
    }),
  }),

  // Subscription Router
  subscriptions: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      return await getSubscription(ctx.user.id);
    }),
    getActiveCount: publicProcedure.query(async () => {
      const subscribers = await getActiveSubscribers();
      return subscribers.length;
    }),
  }),
});

export type AppRouter = typeof appRouter;
