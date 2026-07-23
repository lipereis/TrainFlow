import { mapStripeStatus } from "./sync-subscription";

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
});
