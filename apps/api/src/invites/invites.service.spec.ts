import { InvitesService } from "./invites.service";
import { HttpException } from "@nestjs/common";

describe("InvitesService.accept", () => {
  const prisma: {
    inviteToken: { findUnique: jest.Mock; updateMany: jest.Mock };
    client: { update: jest.Mock };
    $transaction: jest.Mock;
  } = {
    inviteToken: { findUnique: jest.fn(), updateMany: jest.fn() },
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
    prisma.inviteToken.updateMany.mockResolvedValue({ count: 1 });
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
    expect(prisma.inviteToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          token: "tok",
          usedAt: null,
        }),
      }),
    );
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
    expect(prisma.inviteToken.updateMany).not.toHaveBeenCalled();
  });

  it("treats concurrent claim loss as INVITE_ALREADY_USED", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prisma.inviteToken.findUnique
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        token: "tok",
        usedAt: new Date(),
        expiresAt,
        clientId: "c1",
      });
    prisma.inviteToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.accept({
        token: "tok",
        clerkUserId: "user_c",
        email: "ana@ex.com",
        name: "Ana",
      }),
    ).rejects.toMatchObject({
      response: { code: "INVITE_ALREADY_USED" },
    });
    expect(prisma.client.update).not.toHaveBeenCalled();
  });
});
