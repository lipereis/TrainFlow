import { WorkoutsService } from "./workouts.service";

describe("WorkoutsService", () => {
  const prisma: {
    client: { findUnique: jest.Mock };
    workoutProgram: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    workoutDay: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      updateMany: jest.Mock;
    };
    workoutExercise: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  } = {
    client: { findUnique: jest.fn() },
    workoutProgram: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workoutDay: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    workoutExercise: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) => fn(prisma)),
  };

  const service = new WorkoutsService(prisma as never);

  const ownedClient = {
    id: "c1",
    trainerId: "t1",
  };

  const programRow = {
    id: "p1",
    trainerId: "t1",
    clientId: "c1",
    name: "Hypertrophy A/B",
    goal: "Build muscle",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-08-01"),
    daysPerWeek: 3,
    level: "INTERMEDIATE" as const,
    location: "Gym",
    equipment: "Full",
    observations: null as string | null,
    status: "DRAFT" as const,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-02"),
  };

  const dayRow = {
    id: "d1",
    programId: "p1",
    name: "Day A",
    focus: "Push",
    estimatedDurationMin: 60,
    warmup: null as string | null,
    cooldown: null as string | null,
    observations: null as string | null,
    sortOrder: 0,
  };

  const exerciseRow = {
    id: "we1",
    dayId: "d1",
    exerciseId: "e1",
    customName: null as string | null,
    muscleGroup: "Chest",
    category: "Compound",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    weight: 60,
    weightUnit: "KG" as const,
    restSec: 90,
    tempo: null as string | null,
    rpe: null as number | null,
    rir: null as number | null,
    method: "Standard sets",
    sortOrder: 0,
    observation: null as string | null,
    videoUrl: null as string | null,
    alternativeText: null as string | null,
  };

  const nestedProgram = {
    ...programRow,
    days: [
      {
        ...dayRow,
        exercises: [exerciseRow],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
  });

  it("creates a DRAFT program with nested days and exercises", async () => {
    prisma.client.findUnique.mockResolvedValue(ownedClient);
    prisma.workoutProgram.create.mockResolvedValue(nestedProgram);

    const result = await service.create("t1", {
      clientId: "c1",
      name: "Hypertrophy A/B",
      goal: "Build muscle",
      startDate: "2026-07-01",
      endDate: "2026-08-01",
      daysPerWeek: 3,
      level: "INTERMEDIATE",
      location: "Gym",
      equipment: "Full",
      days: [
        {
          name: "Day A",
          focus: "Push",
          estimatedDurationMin: 60,
          sortOrder: 0,
          exercises: [
            {
              exerciseId: "e1",
              muscleGroup: "Chest",
              category: "Compound",
              sets: 3,
              repsMin: 8,
              repsMax: 12,
              weight: 60,
              weightUnit: "KG",
              restSec: 90,
              sortOrder: 0,
            },
          ],
        },
      ],
    });

    expect(prisma.workoutProgram.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trainerId: "t1",
          clientId: "c1",
          status: "DRAFT",
          name: "Hypertrophy A/B",
          days: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                name: "Day A",
                exercises: expect.objectContaining({
                  create: expect.arrayContaining([
                    expect.objectContaining({
                      muscleGroup: "Chest",
                      sets: 3,
                    }),
                  ]),
                }),
              }),
            ]),
          }),
        }),
      }),
    );
    expect(result.status).toBe("DRAFT");
    expect(result.days).toHaveLength(1);
    expect(result.days[0].exercises).toHaveLength(1);
    expect(result.startDate).toBe("2026-07-01T00:00:00.000Z");
  });

  it("throws FORBIDDEN_CROSS_TENANT when creating for another trainer client", async () => {
    prisma.client.findUnique.mockResolvedValue({
      id: "c1",
      trainerId: "t-other",
    });

    await expect(
      service.create("t1", {
        clientId: "c1",
        name: "Nope",
        startDate: "2026-07-01",
        daysPerWeek: 3,
      }),
    ).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
    expect(prisma.workoutProgram.create).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN_CROSS_TENANT when getting another trainer program", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue({
      ...nestedProgram,
      trainerId: "t-other",
    });

    await expect(service.get("t1", "p1")).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
  });

  it("throws WORKOUT_NOT_FOUND when program missing", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(null);

    await expect(service.get("t1", "missing")).rejects.toMatchObject({
      response: { code: "WORKOUT_NOT_FOUND" },
    });
  });

  it("returns nested program with summary on get", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(nestedProgram);

    const result = await service.get("t1", "p1");

    expect(result.id).toBe("p1");
    expect(result.days[0].exercises[0].muscleGroup).toBe("Chest");
    expect(result.summary).toEqual(
      expect.objectContaining({
        sessions: 1,
        totalSets: 3,
        setsByMuscle: { Chest: 3 },
      }),
    );
  });

  it("lists programs scoped to trainer and optional clientId", async () => {
    prisma.workoutProgram.findMany.mockResolvedValue([programRow]);

    const result = await service.list("t1", "c1");

    expect(prisma.workoutProgram.findMany).toHaveBeenCalledWith({
      where: { trainerId: "t1", clientId: "c1" },
      orderBy: [{ updatedAt: "desc" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
  });

  it("updates status to ACTIVE (generate)", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutProgram.update.mockResolvedValue({
      ...programRow,
      status: "ACTIVE",
    });

    const result = await service.update("t1", "p1", { status: "ACTIVE" });

    expect(prisma.workoutProgram.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
    expect(result.status).toBe("ACTIVE");
  });

  it("throws FORBIDDEN_CROSS_TENANT when adding day to foreign program", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue({
      ...programRow,
      trainerId: "t-other",
    });

    await expect(
      service.addDay("t1", "p1", { name: "Day B" }),
    ).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
    expect(prisma.workoutDay.create).not.toHaveBeenCalled();
  });

  it("adds a day to an owned program", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutDay.findMany.mockResolvedValue([dayRow]);
    prisma.workoutDay.create.mockResolvedValue({
      ...dayRow,
      id: "d2",
      name: "Day B",
      sortOrder: 1,
      exercises: [],
    });

    const result = await service.addDay("t1", "p1", { name: "Day B" });

    expect(prisma.workoutDay.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          programId: "p1",
          name: "Day B",
          sortOrder: 1,
        }),
      }),
    );
    expect(result.name).toBe("Day B");
  });

  it("throws FORBIDDEN_CROSS_TENANT when adding exercise to foreign program", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue({
      ...programRow,
      trainerId: "t-other",
    });

    await expect(
      service.addExercise("t1", "p1", "d1", {
        customName: "Push-up",
        muscleGroup: "Chest",
        category: "Bodyweight",
        sets: 3,
        repsMin: 10,
        repsMax: 15,
      }),
    ).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
    expect(prisma.workoutExercise.create).not.toHaveBeenCalled();
  });
});
