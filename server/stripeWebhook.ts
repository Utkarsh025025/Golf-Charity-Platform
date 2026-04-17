import { Stripe } from "stripe";
import { createSubscription, updateSubscription, getSubscription } from "./db";
import type { InsertSubscription } from "../drizzle/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acpi",
});

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  // Test events should be verified but not processed
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected:", event.type);
    return { verified: true };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    throw error;
  }
}

/**
 * Handle checkout.session.completed event
 * This fires when a customer completes the checkout process
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[Webhook] Processing checkout.session.completed:", session.id);

  const userId = parseInt(session.client_reference_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in checkout session");
    return;
  }

  // Get subscription details from Stripe
  if (session.subscription) {
    const subscriptionId = typeof session.subscription === "string" 
      ? session.subscription 
      : session.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Extract plan type from metadata
    const planType = (subscription.metadata?.planType || "monthly") as "monthly" | "yearly";

    // Create subscription record
    const subscriptionData: InsertSubscription = {
      userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      planType,
      status: "active",
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };

    await createSubscription(subscriptionData);
    console.log("[Webhook] Subscription created for user:", userId);
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("[Webhook] Processing customer.subscription.created:", subscription.id);

  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in subscription metadata");
    return;
  }

  const planType = (subscription.metadata?.planType || "monthly") as "monthly" | "yearly";

  const subscriptionData: InsertSubscription = {
    userId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    planType,
    status: "active",
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };

  await createSubscription(subscriptionData);
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[Webhook] Processing customer.subscription.updated:", subscription.id);

  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in subscription metadata");
    return;
  }

  // Map Stripe status to our status
  let status: "active" | "lapsed" | "cancelled" | "pending" = "active";
  if (subscription.status === "past_due") {
    status = "lapsed";
  } else if (subscription.status === "canceled") {
    status = "cancelled";
  } else if (subscription.status === "active") {
    status = "active";
  }

  await updateSubscription(userId, {
    status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
  });

  console.log("[Webhook] Subscription updated for user:", userId, "Status:", status);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Webhook] Processing customer.subscription.deleted:", subscription.id);

  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in subscription metadata");
    return;
  }

  await updateSubscription(userId, {
    status: "cancelled",
    cancelledAt: new Date(),
  });

  console.log("[Webhook] Subscription cancelled for user:", userId);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("[Webhook] Processing invoice.payment_succeeded:", invoice.id);

  if (invoice.subscription) {
    const subscriptionId = typeof invoice.subscription === "string" 
      ? invoice.subscription 
      : invoice.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = parseInt(subscription.metadata?.user_id || "0");

    if (userId) {
      // Update subscription status to active (in case it was past_due)
      await updateSubscription(userId, {
        status: "active",
      });

      console.log("[Webhook] Payment succeeded for user:", userId);
    }
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("[Webhook] Processing invoice.payment_failed:", invoice.id);

  if (invoice.subscription) {
    const subscriptionId = typeof invoice.subscription === "string" 
      ? invoice.subscription 
      : invoice.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = parseInt(subscription.metadata?.user_id || "0");

    if (userId) {
      // Mark subscription as lapsed
      await updateSubscription(userId, {
        status: "lapsed",
      });

      console.log("[Webhook] Payment failed for user:", userId);
    }
  }
}
