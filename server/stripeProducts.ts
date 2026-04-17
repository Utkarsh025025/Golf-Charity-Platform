/**
 * Stripe Products Configuration
 * Defines subscription plans for the golf charity platform
 */

export const STRIPE_PRODUCTS = {
  MONTHLY: {
    name: "Monthly Membership",
    description: "Monthly subscription to GolfGive platform",
    amount: 2999, // $29.99 in cents
    currency: "usd",
    interval: "month" as const,
    metadata: {
      planType: "monthly",
      features: "score_tracking,monthly_draws,charity_support",
    },
  },
  YEARLY: {
    name: "Yearly Membership",
    description: "Annual subscription to GolfGive platform (save 20%)",
    amount: 28799, // $287.99 in cents (20% discount)
    currency: "usd",
    interval: "year" as const,
    metadata: {
      planType: "yearly",
      features: "score_tracking,monthly_draws,charity_support",
    },
  },
};

/**
 * Get subscription plan details
 */
export function getSubscriptionPlan(planType: "monthly" | "yearly") {
  return planType === "monthly" ? STRIPE_PRODUCTS.MONTHLY : STRIPE_PRODUCTS.YEARLY;
}

/**
 * Format price for display
 */
export function formatPrice(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

/**
 * Calculate monthly equivalent for yearly plan
 */
export function getMonthlyEquivalent(yearlyAmountInCents: number): string {
  const monthly = yearlyAmountInCents / 12;
  return `$${(monthly / 100).toFixed(2)}/month`;
}
