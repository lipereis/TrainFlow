import { NextRequest } from "next/server";
import { requireTrainerId } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { appOrigin, jsonOk, withHandler } from "@/server/http";
import { getStripe, proPriceId } from "@/server/billing/stripe";
import { isProEntitled } from "@/server/billing/entitlements";
import { badRequest } from "@/server/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const trainer = await prisma.trainer.findUniqueOrThrow({
      where: { id: trainerId },
    });

    if (isProEntitled(trainer)) {
      throw badRequest(
        "ALREADY_PRO",
        "You already have an active Pro subscription",
      );
    }

    const stripe = getStripe();
    let customerId = trainer.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: trainer.email,
        name: trainer.name,
        metadata: { trainerId: trainer.id },
      });
      customerId = customer.id;
      await prisma.trainer.update({
        where: { id: trainer.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = appOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: proPriceId(), quantity: 1 }],
      success_url: `${origin}/settings/billing?success=1`,
      cancel_url: `${origin}/settings/billing?canceled=1`,
      client_reference_id: trainer.id,
      metadata: { trainerId: trainer.id },
      subscription_data: { metadata: { trainerId: trainer.id } },
    });

    if (!session.url) {
      throw badRequest("CHECKOUT_FAILED", "Stripe did not return a checkout URL");
    }
    return jsonOk({ url: session.url });
  });
}
