import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import { getSubscription, createSubscription } from "./db";
import { subscriberProcedure, adminProcedure } from "./_core/rbac";
import { protectedProcedure, router } from "./_core/trpc";
import { STRIPE_PRODUCTS } from "./stripeProducts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acpi",
});

export const subscriptionRouter = router({
  /**
   * Get current user's subscription status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getSubscription(ctx.user.id);
    return subscription;
  }),

  /**
   * Create a checkout session for subscription
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planType: z.enum(["monthly", "yearly"]),
        charityId: z.number(),
        contributionPercentage: z.number().min(10).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has an active subscription
      const existingSubscription = await getSubscription(ctx.user.id);
      if (existingSubscription?.status === "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has an active subscription",
        });
      }

      const plan = STRIPE_PRODUCTS[input.planType.toUpperCase() as keyof typeof STRIPE_PRODUCTS];
      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid plan type",
        });
      }

      try {
        // Create or get Stripe customer
        let customerId: string;

        if (existingSubscription?.stripeCustomerId) {
          customerId = existingSubscription.stripeCustomerId;
        } else {
          const customer = await stripe.customers.create({
            email: ctx.user.email || undefined,
            name: ctx.user.name || undefined,
            metadata: {
              userId: ctx.user.id.toString(),
              openId: ctx.user.openId,
            },
          });
          customerId = customer.id;
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          client_reference_id: ctx.user.id.toString(),
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: plan.currency,
                product_data: {
                  name: plan.name,
                  description: plan.description,
                  metadata: {
                    planType: input.planType,
                  },
                },
                recurring: {
                  interval: plan.interval,
                  interval_count: 1,
                },
                unit_amount: plan.amount,
              },
              quantity: 1,
            },
          ],
          success_url: `${ctx.req.headers.origin}/dashboard?subscription=success`,
          cancel_url: `${ctx.req.headers.origin}/pricing?subscription=cancelled`,
          allow_promotion_codes: true,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            plan_type: input.planType,
            charity_id: input.charityId.toString(),
            contribution_percentage: input.contributionPercentage.toString(),
          },
        });

        return {
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      } catch (error) {
        console.error("[Subscription] Checkout session creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  /**
   * Cancel subscription
   */
  cancel: subscriberProcedure.mutation(async ({ ctx }) => {
    const subscription = await getSubscription(ctx.user.id);

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription found",
      });
    }

    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      return { success: true };
    } catch (error) {
      console.error("[Subscription] Cancellation failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Get subscription details from Stripe
   */
  getDetails: subscriberProcedure.query(async ({ ctx }) => {
    const subscription = await getSubscription(ctx.user.id);

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      });
    }

    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      return {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date((stripeSubscription.current_period_start as number) * 1000),
        currentPeriodEnd: new Date((stripeSubscription.current_period_end as number) * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        items: stripeSubscription.items.data.map((item) => ({
          id: item.id,
          price: item.price.id,
          quantity: item.quantity,
        })),
      };
    } catch (error) {
      console.error("[Subscription] Failed to retrieve details:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve subscription details",
      });
    }
  }),

  /**
   * Admin: Get all subscriptions
   */
  getAllSubscriptions: adminProcedure.query(async () => {
    try {
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
      });

      return subscriptions.data.map((sub) => ({
        id: sub.id,
        customerId: sub.customer,
        status: sub.status,
        currentPeriodStart: new Date((sub.current_period_start as number) * 1000),
        currentPeriodEnd: new Date((sub.current_period_end as number) * 1000),
      }));
    } catch (error) {
      console.error("[Subscription] Failed to list subscriptions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve subscriptions",
      });
    }
  }),
});
