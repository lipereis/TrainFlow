import { ExercisesService } from "./exercises.service";

describe("ExercisesService", () => {
  const prisma: {
    exercise: {
      create: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  } = {
    exercise: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new ExercisesService(prisma as never);

  const baseRow = {
    id: "e1",
    trainerId: "t1",
    name: "Custom Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: [] as string[],
    category: "Isolation",
    equipment: "Dumbbells",
    defaultInstructions: "Curl with control",
    videoUrl: null as string | null,
    alternativeIds: [] as string[],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  };

  const globalRow = {
    ...baseRow,
    id: "g1",
    trainerId: null,
    name: "Barbell Bench Press",
    primaryMuscle: "Chest",
    category: "Compound",
    equipment: "Barbell",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists global and trainer custom exercises with filters", async () => {
    prisma.exercise.findMany.mockResolvedValue([globalRow, baseRow]);

    const result = await service.list("t1", {
      q: "bench",
      muscle: "Chest",
      category: "Compound",
    });

    expect(prisma.exercise.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ trainerId: null }, { trainerId: "t1" }],
        name: { contains: "bench", mode: "insensitive" },
        primaryMuscle: { equals: "Chest", mode: "insensitive" },
        category: { equals: "Compound", mode: "insensitive" },
      },
      orderBy: [{ name: "asc" }],
    });
    expect(result).toHaveLength(2);
    expect(result[0].trainerId).toBeNull();
    expect(result[1].name).toBe("Custom Curl");
    expect(result[1].createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("creates a custom exercise for the trainer", async () => {
    prisma.exercise.create.mockResolvedValue(baseRow);

    const result = await service.create("t1", {
      name: "Custom Curl",
      primaryMuscle: "Biceps",
      secondaryMuscles: [],
      category: "Isolation",
      equipment: "Dumbbells",
      defaultInstructions: "Curl with control",
      alternativeIds: [],
    });

    expect(prisma.exercise.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        trainerId: "t1",
        name: "Custom Curl",
        primaryMuscle: "Biceps",
      }),
    });
    expect(result.trainerId).toBe("t1");
    expect(result.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("updates owned custom exercise", async () => {
    prisma.exercise.findUnique.mockResolvedValue(baseRow);
    prisma.exercise.update.mockResolvedValue({
      ...baseRow,
      name: "Updated Curl",
      updatedAt: new Date("2026-01-03"),
    });

    const result = await service.update("t1", "e1", { name: "Updated Curl" });

    expect(prisma.exercise.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: expect.objectContaining({ name: "Updated Curl" }),
    });
    expect(result.name).toBe("Updated Curl");
  });

  it("removes owned custom exercise", async () => {
    prisma.exercise.findUnique.mockResolvedValue(baseRow);
    prisma.exercise.delete.mockResolvedValue(baseRow);

    await service.remove("t1", "e1");

    expect(prisma.exercise.delete).toHaveBeenCalledWith({
      where: { id: "e1" },
    });
  });

  it("throws FORBIDDEN when updating a global exercise", async () => {
    prisma.exercise.findUnique.mockResolvedValue(globalRow);

    await expect(
      service.update("t1", "g1", { name: "Nope" }),
    ).rejects.toMatchObject({
      response: { code: "FORBIDDEN" },
    });
    expect(prisma.exercise.update).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN_CROSS_TENANT when updating another trainer custom", async () => {
    prisma.exercise.findUnique.mockResolvedValue({
      ...baseRow,
      trainerId: "t-other",
    });

    await expect(
      service.update("t1", "e1", { name: "Nope" }),
    ).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
    expect(prisma.exercise.update).not.toHaveBeenCalled();
  });

  it("throws EXERCISE_NOT_FOUND when deleting missing exercise", async () => {
    prisma.exercise.findUnique.mockResolvedValue(null);

    await expect(service.remove("t1", "missing")).rejects.toMatchObject({
      response: { code: "EXERCISE_NOT_FOUND" },
    });
    expect(prisma.exercise.delete).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN when deleting a global exercise", async () => {
    prisma.exercise.findUnique.mockResolvedValue(globalRow);

    await expect(service.remove("t1", "g1")).rejects.toMatchObject({
      response: { code: "FORBIDDEN" },
    });
    expect(prisma.exercise.delete).not.toHaveBeenCalled();
  });
});
