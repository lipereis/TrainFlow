import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { jsonOk, withHandler } from "@/server/http";
import { misconfigured, unauthorized } from "@/server/errors";
import { prisma } from "@/server/prisma";
import { getStripe } from "@/server/billing/stripe";
import {
  applyStripeSubscription,
  resolveInvoiceSubscriptionId,
} from "@/server/billing/sync-subscription";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw misconfigured(
        "WEBHOOK_SECRET_MISSING",
        "STRIPE_WEBHOOK_SECRET is not configured",
      );
    }
    const stripe = getStripe();
    const payload = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw unauthorized("UNAUTHORIZED", "Missing stripe-signature");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, secret);
    } catch {
      throw unauthorized("UNAUTHORIZED", "Invalid Stripe signature");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const trainerId =
          session.metadata?.trainerId ?? session.client_reference_id;
        if (trainerId && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applyStripeSubscription(trainerId, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const trainerId =
          sub.metadata?.trainerId ??
          (
            await prisma.trainer.findFirst({
              where: {
                stripeCustomerId:
                  typeof sub.customer === "string"
                    ? sub.customer
                    : sub.customer.id,
              },
              select: { id: true },
            })
          )?.id;
        if (trainerId) await applyStripeSubscription(trainerId, sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = resolveInvoiceSubscriptionId(invoice);
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const trainerId =
          sub.metadata?.trainerId ??
          (
            await prisma.trainer.findFirst({
              where: {
                stripeCustomerId:
                  typeof sub.customer === "string"
                    ? sub.customer
                    : sub.customer.id,
              },
              select: { id: true },
            })
          )?.id;
        if (trainerId) await applyStripeSubscription(trainerId, sub);
        break;
      }
      default:
        break;
    }

    return jsonOk({ received: true });
  });
}
