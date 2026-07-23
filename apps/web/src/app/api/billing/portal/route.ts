import { NextRequest } from "next/server";
import { requireTrainerId } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { appOrigin, jsonOk, withHandler } from "@/server/http";
import { getStripe } from "@/server/billing/stripe";
import { badRequest } from "@/server/errors";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const trainer = await prisma.trainer.findUniqueOrThrow({
      where: { id: trainerId },
    });

    if (!trainer.stripeCustomerId) {
      throw badRequest(
        "NO_CUSTOMER",
        "No Stripe customer exists for this trainer",
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: trainer.stripeCustomerId,
      return_url: `${appOrigin()}/settings/billing`,
    });

    return jsonOk({ url: session.url });
  });
}
