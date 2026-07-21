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
    $transaction: jest.fn(),
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
      (arg: ((tx: typeof prisma) => unknown) | PromiseLike<unknown>[]) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        return arg(prisma);
      },
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

  it("lists programs without summary or days", async () => {
    prisma.workoutProgram.findMany.mockResolvedValue([programRow]);

    const result = await service.list("t1", "c1");

    expect(prisma.workoutProgram.findMany).toHaveBeenCalledWith({
      where: { trainerId: "t1", clientId: "c1" },
      orderBy: [{ updatedAt: "desc" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
    expect(result[0]).not.toHaveProperty("summary");
    expect(result[0]).not.toHaveProperty("days");
  });

  it("updates status to ACTIVE (generate)", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutProgram.update.mockResolvedValue({
      ...programRow,
      status: "ACTIVE",
      days: [],
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

  it("reorders days with contiguous sortOrder via $transaction array", async () => {
    prisma.workoutProgram.findUnique
      .mockResolvedValueOnce(programRow)
      .mockResolvedValueOnce({
        ...nestedProgram,
        days: [
          { ...dayRow, id: "d2", sortOrder: 0, exercises: [] },
          { ...dayRow, id: "d1", sortOrder: 1, exercises: [exerciseRow] },
        ],
      });
    prisma.workoutDay.findMany.mockResolvedValue([
      { ...dayRow, id: "d1", sortOrder: 0 },
      { ...dayRow, id: "d2", sortOrder: 1 },
    ]);
    prisma.workoutDay.update.mockResolvedValue({});

    await service.reorderDays("t1", "p1", ["d2", "d1"]);

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.anything(),
        expect.anything(),
      ]),
    );
    expect(prisma.workoutDay.update).toHaveBeenCalledWith({
      where: { id: "d2" },
      data: { sortOrder: 0 },
    });
    expect(prisma.workoutDay.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { sortOrder: 1 },
    });
  });

  it("reorders exercises with contiguous sortOrder", async () => {
    const we2 = { ...exerciseRow, id: "we2", sortOrder: 1 };
    prisma.workoutProgram.findUnique
      .mockResolvedValueOnce(programRow)
      .mockResolvedValueOnce({
        ...nestedProgram,
        days: [{ ...dayRow, exercises: [we2, exerciseRow] }],
      });
    prisma.workoutDay.findUnique.mockResolvedValue({
      ...dayRow,
      exercises: [exerciseRow, we2],
    });
    prisma.workoutExercise.findMany.mockResolvedValue([exerciseRow, we2]);
    prisma.workoutExercise.update.mockResolvedValue({});

    await service.reorderExercises("t1", "p1", "d1", ["we2", "we1"]);

    expect(prisma.workoutExercise.update).toHaveBeenCalledWith({
      where: { id: "we2" },
      data: { sortOrder: 0 },
    });
    expect(prisma.workoutExercise.update).toHaveBeenCalledWith({
      where: { id: "we1" },
      data: { sortOrder: 1 },
    });
  });

  it("moveExercise inserts at sortOrder without duplicate orders on target day", async () => {
    const we2 = { ...exerciseRow, id: "we2", dayId: "d2", sortOrder: 0 };
    const we3 = { ...exerciseRow, id: "we3", dayId: "d2", sortOrder: 1 };
    const day2 = { ...dayRow, id: "d2", name: "Day B", sortOrder: 1 };

    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutDay.findUnique
      .mockResolvedValueOnce({ ...dayRow, exercises: [exerciseRow] })
      .mockResolvedValueOnce({ ...day2, exercises: [we2, we3] });
    prisma.workoutExercise.findUnique.mockResolvedValue(exerciseRow);

    prisma.workoutExercise.findMany
      .mockResolvedValueOnce([we2, we3])
      .mockResolvedValueOnce([]);
    prisma.workoutExercise.update.mockImplementation(
      ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({
          ...(where.id === "we1"
            ? exerciseRow
            : where.id === "we2"
              ? we2
              : we3),
          ...data,
          id: where.id,
        }),
    );

    const result = await service.moveExercise(
      "t1",
      "p1",
      "d1",
      "we1",
      "d2",
      0,
    );

    expect(result.dayId).toBe("d2");
    expect(result.sortOrder).toBe(0);

    const targetUpdates = prisma.workoutExercise.update.mock.calls
      .map(
        ([args]: [{ where: { id: string }; data: { dayId?: string; sortOrder: number } }]) =>
          args,
      )
      .filter((args) => args.data.sortOrder !== undefined);

    const targetDayOrders = targetUpdates
      .filter(
        (a) =>
          a.where.id === "we1" ||
          a.where.id === "we2" ||
          a.where.id === "we3",
      )
      .slice(0, 3)
      .map((a) => ({ id: a.where.id, ...a.data }));

    expect(targetDayOrders).toEqual([
      { id: "we1", dayId: "d2", sortOrder: 0 },
      { id: "we2", sortOrder: 1 },
      { id: "we3", sortOrder: 2 },
    ]);

    const sortOrders = targetDayOrders.map((u) => u.sortOrder);
    expect(new Set(sortOrders).size).toBe(sortOrders.length);
  });

  it("moveExercise same-day reassigns contiguous unique sortOrders", async () => {
    const we2 = { ...exerciseRow, id: "we2", sortOrder: 1 };
    const we3 = { ...exerciseRow, id: "we3", sortOrder: 2 };

    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutDay.findUnique.mockResolvedValue({
      ...dayRow,
      exercises: [exerciseRow, we2, we3],
    });
    prisma.workoutExercise.findUnique.mockResolvedValue(exerciseRow);
    prisma.workoutExercise.findMany.mockResolvedValue([we2, we3]);
    prisma.workoutExercise.update.mockImplementation(
      ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({
          ...(where.id === "we1"
            ? exerciseRow
            : where.id === "we2"
              ? we2
              : we3),
          ...data,
          id: where.id,
        }),
    );

    const result = await service.moveExercise(
      "t1",
      "p1",
      "d1",
      "we1",
      "d1",
      2,
    );

    expect(result.sortOrder).toBe(2);
    const orders = prisma.workoutExercise.update.mock.calls.map(
      ([args]: [{ where: { id: string }; data: { sortOrder: number } }]) => ({
        id: args.where.id,
        sortOrder: args.data.sortOrder,
      }),
    );
    expect(orders).toEqual([
      { id: "we2", sortOrder: 0 },
      { id: "we3", sortOrder: 1 },
      { id: "we1", sortOrder: 2 },
    ]);
    expect(new Set(orders.map((o) => o.sortOrder)).size).toBe(3);
  });

  it("duplicates a program as DRAFT with (copy) name", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(nestedProgram);
    prisma.workoutProgram.create.mockResolvedValue({
      ...nestedProgram,
      id: "p2",
      name: "Hypertrophy A/B (copy)",
      status: "DRAFT",
    });

    const result = await service.duplicateProgram("t1", "p1");

    expect(prisma.workoutProgram.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Hypertrophy A/B (copy)",
          status: "DRAFT",
          clientId: "c1",
          trainerId: "t1",
        }),
      }),
    );
    expect(result.id).toBe("p2");
    expect(result.name).toBe("Hypertrophy A/B (copy)");
    expect(result.status).toBe("DRAFT");
  });

  it("duplicates a day appending at end with (copy) name", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutDay.findUnique.mockResolvedValue({
      ...dayRow,
      exercises: [exerciseRow],
    });
    prisma.workoutDay.findMany.mockResolvedValue([dayRow]);
    prisma.workoutDay.create.mockResolvedValue({
      ...dayRow,
      id: "d2",
      name: "Day A (copy)",
      sortOrder: 1,
      exercises: [{ ...exerciseRow, id: "we2", dayId: "d2" }],
    });

    const result = await service.duplicateDay("t1", "p1", "d1");

    expect(prisma.workoutDay.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Day A (copy)",
          sortOrder: 1,
          programId: "p1",
        }),
      }),
    );
    expect(result.name).toBe("Day A (copy)");
    expect(result.sortOrder).toBe(1);
  });

  it("deletes program, day, and exercise after ownership checks", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutProgram.delete.mockResolvedValue(programRow);
    prisma.workoutDay.findUnique.mockResolvedValue({
      ...dayRow,
      exercises: [exerciseRow],
    });
    prisma.workoutDay.delete.mockResolvedValue(dayRow);
    prisma.workoutExercise.findUnique.mockResolvedValue(exerciseRow);
    prisma.workoutExercise.delete.mockResolvedValue(exerciseRow);

    await service.remove("t1", "p1");
    expect(prisma.workoutProgram.delete).toHaveBeenCalledWith({
      where: { id: "p1" },
    });

    await service.removeDay("t1", "p1", "d1");
    expect(prisma.workoutDay.delete).toHaveBeenCalledWith({
      where: { id: "d1" },
    });

    await service.removeExercise("t1", "p1", "d1", "we1");
    expect(prisma.workoutExercise.delete).toHaveBeenCalledWith({
      where: { id: "we1" },
    });
  });

  it("rejects partial exercise PATCH when merged repsMin > repsMax", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutDay.findUnique.mockResolvedValue({
      ...dayRow,
      exercises: [exerciseRow],
    });
    prisma.workoutExercise.findUnique.mockResolvedValue(exerciseRow);

    await expect(
      service.updateExercise("t1", "p1", "d1", "we1", { repsMin: 15 }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
    expect(prisma.workoutExercise.update).not.toHaveBeenCalled();
  });

  it("rejects partial exercise PATCH that clears both exerciseId and customName", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);
    prisma.workoutDay.findUnique.mockResolvedValue({
      ...dayRow,
      exercises: [exerciseRow],
    });
    prisma.workoutExercise.findUnique.mockResolvedValue({
      ...exerciseRow,
      exerciseId: null,
      customName: "Push-up",
    });

    await expect(
      service.updateExercise("t1", "p1", "d1", "we1", { customName: "  " }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
    expect(prisma.workoutExercise.update).not.toHaveBeenCalled();
  });

  it("rejects program PATCH when only endDate is before existing startDate", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);

    await expect(
      service.update("t1", "p1", { endDate: "2026-06-01" }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
    expect(prisma.workoutProgram.update).not.toHaveBeenCalled();
  });

  it("rejects program PATCH when only startDate is after existing endDate", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue(programRow);

    await expect(
      service.update("t1", "p1", { startDate: "2026-09-01" }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
    expect(prisma.workoutProgram.update).not.toHaveBeenCalled();
  });
});
