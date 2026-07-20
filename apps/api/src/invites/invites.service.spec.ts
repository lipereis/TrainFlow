import { InvitesService } from "./invites.service";
import { HttpException } from "@nestjs/common";

describe("InvitesService.accept", () => {
  const prisma: {
    inviteToken: { findUnique: jest.Mock; update: jest.Mock };
    client: { update: jest.Mock };
    $transaction: jest.Mock;
  } = {
    inviteToken: { findUnique: jest.fn(), update: jest.fn() },
    client: { update: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) => fn(prisma)),
  };
  const service = new InvitesService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((fn) => fn(prisma));
  });

  it("activates client for valid token", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prisma.inviteToken.findUnique.mockResolvedValue({
      token: "tok",
      usedAt: null,
      expiresAt,
      clientId: "c1",
      client: {
        id: "c1",
        trainerId: "t1",
        clerkUserId: null,
        name: "Ana",
        email: "ana@ex.com",
        status: "PENDING",
        createdAt: new Date(),
      },
    });
    prisma.inviteToken.update.mockResolvedValue({});
    prisma.client.update.mockResolvedValue({
      id: "c1",
      trainerId: "t1",
      clerkUserId: "user_c",
      name: "Ana",
      email: "ana@ex.com",
      status: "ACTIVE",
      createdAt: new Date(),
    });

    const result = await service.accept({
      token: "tok",
      clerkUserId: "user_c",
      email: "ana@ex.com",
      name: "Ana",
    });
    expect(result.status).toBe("ACTIVE");
    expect(result.clerkUserId).toBe("user_c");
  });

  it("throws INVITE_EXPIRED", async () => {
    prisma.inviteToken.findUnique.mockResolvedValue({
      token: "tok",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      clientId: "c1",
      client: {},
    });
    await expect(
      service.accept({
        token: "tok",
        clerkUserId: "user_c",
        email: "ana@ex.com",
        name: "Ana",
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
