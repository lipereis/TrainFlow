import { ClientsService } from "./clients.service";

describe("ClientsService.invite", () => {
  const prisma: {
    client: {
      create: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    inviteToken: {
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  } = {
    client: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inviteToken: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) => fn(prisma)),
  };

  const clerk = {
    sendInvitation: jest.fn().mockResolvedValue(undefined),
  };

  const service = new ClientsService(prisma as never, clerk as never);

  beforeEach(() => {
    jest.clearAllMocks();
    clerk.sendInvitation.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation((fn) => fn(prisma));
  });

  it("creates PENDING client with invite token", async () => {
    const client = {
      id: "c1",
      trainerId: "t1",
      clerkUserId: null,
      name: "Ana",
      email: "ana@ex.com",
      status: "PENDING",
      createdAt: new Date("2026-01-01"),
    };
    prisma.client.create.mockResolvedValue(client);
    prisma.inviteToken.create.mockResolvedValue({
      token: "abc",
      clientId: "c1",
    });

    const result = await service.invite("t1", {
      name: "Ana",
      email: "ana@ex.com",
    });

    expect(result.status).toBe("PENDING");
    expect(result.email).toBe("ana@ex.com");
    expect(clerk.sendInvitation).toHaveBeenCalled();
    const inviteArg = clerk.sendInvitation.mock.calls[0][0];
    expect(inviteArg.publicMetadata).toEqual(
      expect.objectContaining({
        role: "CLIENT",
        inviteToken: expect.any(String),
      }),
    );
    expect(inviteArg.redirectUrl).toContain("invite_token=");
  });

  it("throws FORBIDDEN_CROSS_TENANT when resending other trainer client", async () => {
    prisma.client.findFirst.mockResolvedValue(null);
    await expect(service.resendInvite("t1", "c-other")).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
  });

  it("rolls back PENDING client when Clerk invitation fails", async () => {
    const client = {
      id: "c1",
      trainerId: "t1",
      clerkUserId: null,
      name: "Ana",
      email: "ana@ex.com",
      status: "PENDING",
      createdAt: new Date("2026-01-01"),
    };
    prisma.client.create.mockResolvedValue(client);
    prisma.client.delete.mockResolvedValue(client);
    clerk.sendInvitation.mockRejectedValue(new Error("Clerk down"));

    await expect(
      service.invite("t1", { name: "Ana", email: "ana@ex.com" }),
    ).rejects.toThrow("Clerk down");
    expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });
});
