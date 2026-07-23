import type Stripe from "stripe";
import {
  mapStripeStatus,
  resolveInvoiceSubscriptionId,
} from "./sync-subscription";

describe("mapStripeStatus", () => {
  it("maps active to PRO + ACTIVE", () => {
    expect(mapStripeStatus("active")).toEqual({
      plan: "PRO",
      planStatus: "ACTIVE",
    });
  });

  it("maps past_due to PRO + PAST_DUE", () => {
    expect(mapStripeStatus("past_due")).toEqual({
      plan: "PRO",
      planStatus: "PAST_DUE",
    });
  });

  it("maps canceled to FREE + CANCELED", () => {
    expect(mapStripeStatus("canceled")).toEqual({
      plan: "FREE",
      planStatus: "CANCELED",
    });
  });

  it("maps unpaid to FREE + CANCELED", () => {
    expect(mapStripeStatus("unpaid")).toEqual({
      plan: "FREE",
      planStatus: "CANCELED",
    });
  });

  it("maps incomplete to FREE + INCOMPLETE", () => {
    expect(mapStripeStatus("incomplete")).toEqual({
      plan: "FREE",
      planStatus: "INCOMPLETE",
    });
  });

  it("maps incomplete_expired to FREE + INCOMPLETE", () => {
    expect(mapStripeStatus("incomplete_expired")).toEqual({
      plan: "FREE",
      planStatus: "INCOMPLETE",
    });
  });
});

describe("resolveInvoiceSubscriptionId", () => {
  it("reads parent.subscription_details.subscription string", () => {
    const invoice = {
      parent: {
        type: "subscription_details",
        quote_details: null,
        subscription_details: { subscription: "sub_123", metadata: null },
      },
    } as Stripe.Invoice;
    expect(resolveInvoiceSubscriptionId(invoice)).toBe("sub_123");
  });

  it("reads expanded parent subscription", () => {
    const invoice = {
      parent: {
        type: "subscription_details",
        quote_details: null,
        subscription_details: {
          subscription: { id: "sub_exp" },
          metadata: null,
        },
      },
    } as Stripe.Invoice;
    expect(resolveInvoiceSubscriptionId(invoice)).toBe("sub_exp");
  });

  it("reads legacy top-level subscription field", () => {
    const invoice = {
      parent: null,
      subscription: "sub_legacy",
    } as Stripe.Invoice & { subscription: string };
    expect(resolveInvoiceSubscriptionId(invoice)).toBe("sub_legacy");
  });

  it("returns null when no subscription", () => {
    const invoice = { parent: null } as Stripe.Invoice;
    expect(resolveInvoiceSubscriptionId(invoice)).toBeNull();
  });
});
