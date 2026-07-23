import Stripe from "stripe";
import { misconfigured } from "@/server/errors";

export function getStripe(): Stripe {
  // Prefer STRIPE_SECRET_KEY; accept common Vercel misnames until operators rename.
  const key =
    process.env.STRIPE_SECRET_KEY ||
    process.env.Secret_key ||
    process.env.secret;
  if (!key) {
    throw misconfigured("STRIPE_NOT_CONFIGURED", "STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_PRO;
  if (!id) {
    throw misconfigured("STRIPE_PRICE_MISSING", "STRIPE_PRICE_ID_PRO is not set");
  }
  return id;
}
