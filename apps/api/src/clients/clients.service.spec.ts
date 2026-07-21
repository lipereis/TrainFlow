import { ClientsService } from "./clients.service";

describe("ClientsService.invite", () => {
  const prisma: {
    client: {
      create: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
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
      findUnique: jest.fn(),
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
      phone: null,
      birthDate: null,
      heightCm: null,
      weightKg: null,
      goal: null,
      experienceLevel: null,
      weeklyAvailability: null,
      injuries: null,
      restrictions: null,
      equipment: null,
      observations: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
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
      phone: null,
      birthDate: null,
      heightCm: null,
      weightKg: null,
      goal: null,
      experienceLevel: null,
      weeklyAvailability: null,
      injuries: null,
      restrictions: null,
      equipment: null,
      observations: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
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

describe("ClientsService CRUD", () => {
  const prisma: {
    client: {
      create: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
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
      findUnique: jest.fn(),
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

  const baseRow = {
    id: "c1",
    trainerId: "t1",
    clerkUserId: null,
    name: "Ana",
    email: "ana@ex.com",
    status: "ACTIVE" as const,
    phone: "11999999999",
    birthDate: new Date("1990-05-15"),
    heightCm: 165,
    weightKg: 60,
    goal: "Hypertrophy",
    experienceLevel: "INTERMEDIATE" as const,
    weeklyAvailability: "3x",
    injuries: null,
    restrictions: null,
    equipment: "Dumbbells",
    observations: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates client with full profile fields", async () => {
    prisma.client.create.mockResolvedValue(baseRow);

    const result = await service.create("t1", {
      name: "Ana",
      email: "ana@ex.com",
      phone: "11999999999",
      birthDate: "1990-05-15",
      heightCm: 165,
      weightKg: 60,
      goal: "Hypertrophy",
      experienceLevel: "INTERMEDIATE",
      weeklyAvailability: "3x",
      equipment: "Dumbbells",
    });

    expect(prisma.client.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        trainerId: "t1",
        name: "Ana",
        email: "ana@ex.com",
        status: "ACTIVE",
        phone: "11999999999",
        heightCm: 165,
        weightKg: 60,
        goal: "Hypertrophy",
        experienceLevel: "INTERMEDIATE",
        birthDate: new Date("1990-05-15"),
      }),
    });
    expect(result.phone).toBe("11999999999");
    expect(result.goal).toBe("Hypertrophy");
    expect(result.birthDate).toBe("1990-05-15T00:00:00.000Z");
    expect(result.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("updates owned client profile fields", async () => {
    prisma.client.findUnique.mockResolvedValue(baseRow);
    prisma.client.update.mockResolvedValue({
      ...baseRow,
      goal: "Strength",
      weightKg: 62,
      updatedAt: new Date("2026-01-03"),
    });

    const result = await service.update("t1", "c1", {
      goal: "Strength",
      weightKg: 62,
    });

    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({
        goal: "Strength",
        weightKg: 62,
      }),
    });
    expect(result.goal).toBe("Strength");
    expect(result.weightKg).toBe(62);
  });

  it("lists clients filtered by search query on name or email", async () => {
    prisma.client.findMany.mockResolvedValue([baseRow]);

    const result = await service.list("t1", "ana");

    expect(prisma.client.findMany).toHaveBeenCalledWith({
      where: {
        trainerId: "t1",
        OR: [
          { name: { contains: "ana", mode: "insensitive" } },
          { email: { contains: "ana", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ana");
  });

  it("throws FORBIDDEN_CROSS_TENANT on get for other trainer client", async () => {
    prisma.client.findUnique.mockResolvedValue({
      ...baseRow,
      trainerId: "t-other",
    });

    await expect(service.get("t1", "c1")).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
  });

  it("removes owned client", async () => {
    prisma.client.findUnique.mockResolvedValue(baseRow);
    prisma.client.delete.mockResolvedValue(baseRow);

    await service.remove("t1", "c1");

    expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("throws FORBIDDEN_CROSS_TENANT on update for other trainer client", async () => {
    prisma.client.findUnique.mockResolvedValue({
      ...baseRow,
      trainerId: "t-other",
    });

    await expect(
      service.update("t1", "c1", { goal: "x" }),
    ).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
    expect(prisma.client.update).not.toHaveBeenCalled();
  });
});
