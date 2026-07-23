import type Stripe from "stripe";
import type { TrainerPlan, TrainerPlanStatus } from "@trainflow/db";
import { prisma } from "@/server/prisma";

export function mapStripeStatus(
  status: Stripe.Subscription.Status,
): { plan: TrainerPlan; planStatus: TrainerPlanStatus } {
  switch (status) {
    case "active":
      return { plan: "PRO", planStatus: "ACTIVE" };
    case "past_due":
      return { plan: "PRO", planStatus: "PAST_DUE" };
    case "incomplete":
    case "incomplete_expired":
      return { plan: "FREE", planStatus: "INCOMPLETE" };
    case "canceled":
    case "unpaid":
    default:
      return { plan: "FREE", planStatus: "CANCELED" };
  }
}

/** Resolve subscription id from Invoice (legacy `subscription` or `parent.subscription_details`). */
export function resolveInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (fromParent) {
    return typeof fromParent === "string" ? fromParent : fromParent.id;
  }
  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;
  if (!legacy) return null;
  return typeof legacy === "string" ? legacy : legacy.id;
}

export async function applyStripeSubscription(
  trainerId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const mapped = mapStripeStatus(sub.status);
  await prisma.trainer.update({
    where: { id: trainerId },
    data: {
      stripeSubscriptionId: sub.id,
      stripeCustomerId:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      plan: mapped.plan,
      planStatus: mapped.planStatus,
    },
  });
}
