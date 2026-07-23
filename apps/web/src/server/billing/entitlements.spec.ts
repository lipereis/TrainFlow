import { ApiError } from "../errors";
import {
  freeClientLimit,
  isProEntitled,
  assertCanCreateClient,
} from "./entitlements";

jest.mock("@/server/prisma", () => ({
  prisma: {
    trainer: { findUniqueOrThrow: jest.fn() },
    client: { count: jest.fn() },
  },
}));

import { prisma } from "@/server/prisma";

const mockedPrisma = prisma as unknown as {
  trainer: { findUniqueOrThrow: jest.Mock };
  client: { count: jest.Mock };
};

describe("isProEntitled", () => {
  it("true for PRO + ACTIVE", () => {
    expect(isProEntitled({ plan: "PRO", planStatus: "ACTIVE" })).toBe(true);
  });
  it("true for PRO + PAST_DUE (grace)", () => {
    expect(isProEntitled({ plan: "PRO", planStatus: "PAST_DUE" })).toBe(true);
  });
  it("false for FREE + NONE", () => {
    expect(isProEntitled({ plan: "FREE", planStatus: "NONE" })).toBe(false);
  });
  it("false for PRO + CANCELED", () => {
    expect(isProEntitled({ plan: "PRO", planStatus: "CANCELED" })).toBe(false);
  });
});

describe("freeClientLimit", () => {
  const prev = process.env.FREE_CLIENT_LIMIT;
  afterEach(() => {
    if (prev === undefined) delete process.env.FREE_CLIENT_LIMIT;
    else process.env.FREE_CLIENT_LIMIT = prev;
  });
  it("defaults to 2", () => {
    delete process.env.FREE_CLIENT_LIMIT;
    expect(freeClientLimit()).toBe(2);
  });
  it("reads env", () => {
    process.env.FREE_CLIENT_LIMIT = "5";
    expect(freeClientLimit()).toBe(5);
  });
});

describe("assertCanCreateClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.FREE_CLIENT_LIMIT;
  });

  it("allows when Pro", async () => {
    mockedPrisma.trainer.findUniqueOrThrow.mockResolvedValue({
      plan: "PRO",
      planStatus: "ACTIVE",
    });
    await expect(assertCanCreateClient("t1")).resolves.toBeUndefined();
    expect(mockedPrisma.client.count).not.toHaveBeenCalled();
  });

  it("allows free under limit", async () => {
    mockedPrisma.trainer.findUniqueOrThrow.mockResolvedValue({
      plan: "FREE",
      planStatus: "NONE",
    });
    mockedPrisma.client.count.mockResolvedValue(1);
    await expect(assertCanCreateClient("t1")).resolves.toBeUndefined();
  });

  it("403 CLIENT_LIMIT_REACHED when free at limit", async () => {
    mockedPrisma.trainer.findUniqueOrThrow.mockResolvedValue({
      plan: "FREE",
      planStatus: "NONE",
    });
    mockedPrisma.client.count.mockResolvedValue(2);
    try {
      await assertCanCreateClient("t1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).code).toBe("CLIENT_LIMIT_REACHED");
    }
  });
});
