import { TRPCError } from "@trpc/server";
import { getSubscription } from "../db";
import { protectedProcedure } from "./trpc";

/**
 * Subscriber-only procedure: ensures user has an active subscription
 */
export const subscriberProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const subscription = await getSubscription(ctx.user.id);

  if (!subscription || subscription.status !== "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature requires an active subscription",
    });
  }

  return next({ ctx });
});

/**
 * Admin-only procedure: ensures user has admin role
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires admin privileges",
    });
  }

  return next({ ctx });
});

/**
 * Helper to check if user is admin
 */
export function isAdmin(role: string): boolean {
  return role === "admin";
}

/**
 * Helper to check if user has active subscription
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const subscription = await getSubscription(userId);
  return subscription ? subscription.status === "active" : false;
}
