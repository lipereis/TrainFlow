import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { TemplatesService } from "./templates.service";

describe("TemplatesService", () => {
  const prisma: {
    workoutTemplate: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    workoutProgram: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    client: {
      findUnique: jest.Mock;
    };
    exercise: {
      findMany: jest.Mock;
    };
  } = {
    workoutTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    workoutProgram: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    exercise: {
      findMany: jest.fn(),
    },
  };

  const service = new TemplatesService(prisma as never);

  const sampleTemplate = {
    id: "tmpl1",
    trainerId: null as string | null,
    name: "Beginner Full Body 3d",
    goal: "General fitness",
    daysPerWeek: 3,
    level: "BEGINNER" as const,
    observations: "Sample",
    isSample: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
    days: [
      {
        id: "td1",
        templateId: "tmpl1",
        name: "Full Body A",
        focus: "Full body",
        warmup: null,
        cooldown: null,
        observations: null,
        sortOrder: 0,
        exercises: [
          {
            id: "te1",
            dayId: "td1",
            exerciseId: "ex1",
            customName: null,
            muscleGroup: "Quads",
            category: "Compound",
            sets: 3,
            repsMin: 8,
            repsMax: 10,
            weight: null,
            weightUnit: "KG" as const,
            restSec: 90,
            tempo: null,
            rpe: null,
            rir: null,
            method: "Standard sets",
            sortOrder: 0,
            observation: null,
            videoUrl: null,
            alternativeText: null,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists sample and trainer templates with filters", async () => {
    prisma.workoutTemplate.findMany.mockResolvedValue([
      { ...sampleTemplate, days: [{ id: "td1" }] },
    ]);

    const result = await service.list("t1", {
      q: "Beginner",
      goal: "fitness",
      daysPerWeek: "3",
    });

    expect(prisma.workoutTemplate.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ isSample: true }, { trainerId: "t1" }],
        name: { contains: "Beginner", mode: "insensitive" },
        goal: { contains: "fitness", mode: "insensitive" },
        daysPerWeek: 3,
      },
      include: {
        days: { select: { id: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ isSample: "desc" }, { name: "asc" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].isSample).toBe(true);
    expect(result[0].dayCount).toBe(1);
    expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("gets an accessible sample template with days", async () => {
    prisma.workoutTemplate.findUnique.mockResolvedValue(sampleTemplate);

    const result = await service.get("t1", "tmpl1");

    expect(result.days).toHaveLength(1);
    expect(result.days[0].exercises[0].muscleGroup).toBe("Quads");
  });

  it("forbids another trainer private template", async () => {
    prisma.workoutTemplate.findUnique.mockResolvedValue({
      ...sampleTemplate,
      isSample: false,
      trainerId: "other",
    });

    await expect(service.get("t1", "tmpl1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("creates a template from an owned workout", async () => {
    prisma.workoutProgram.findUnique.mockResolvedValue({
      id: "w1",
      trainerId: "t1",
      name: "Client Program",
      goal: "Strength",
      daysPerWeek: 3,
      level: "INTERMEDIATE",
      observations: null,
      days: sampleTemplate.days.map((d) => ({
        ...d,
        programId: "w1",
        estimatedDurationMin: null,
      })),
    });
    prisma.workoutTemplate.create.mockResolvedValue({
      ...sampleTemplate,
      id: "tmpl-new",
      trainerId: "t1",
      isSample: false,
      name: "Saved Template",
    });

    const result = await service.createFromWorkout("t1", "w1", {
      name: "Saved Template",
    });

    expect(prisma.workoutTemplate.create).toHaveBeenCalled();
    expect(result.name).toBe("Saved Template");
    expect(result.isSample).toBe(false);
  });

  it("creates a DRAFT workout from a template for owned client", async () => {
    prisma.workoutTemplate.findUnique.mockResolvedValue(sampleTemplate);
    prisma.client.findUnique.mockResolvedValue({
      id: "c1",
      trainerId: "t1",
    });
    prisma.exercise.findMany.mockResolvedValue([
      { id: "ex1", name: "Back Squat" },
    ]);
    prisma.workoutProgram.create.mockResolvedValue({ id: "prog1" });

    const id = await service.createWorkoutFromTemplate("t1", "tmpl1", {
      clientId: "c1",
      name: "From template",
    });

    expect(id).toBe("prog1");
    expect(prisma.exercise.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["ex1"] } },
      select: { id: true, name: true },
    });
    expect(prisma.workoutProgram.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trainerId: "t1",
          clientId: "c1",
          name: "From template",
          status: "DRAFT",
          daysPerWeek: 3,
          days: {
            create: [
              expect.objectContaining({
                exercises: {
                  create: [
                    expect.objectContaining({
                      exerciseId: "ex1",
                      customName: "Back Squat",
                    }),
                  ],
                },
              }),
            ],
          },
        }),
      }),
    );
  });

  it("resolves catalog exercise names when template customName is empty", async () => {
    prisma.workoutTemplate.findUnique.mockResolvedValue({
      ...sampleTemplate,
      days: [
        {
          ...sampleTemplate.days[0],
          exercises: [
            {
              ...sampleTemplate.days[0].exercises[0],
              customName: "   ",
              exerciseId: "ex1",
            },
          ],
        },
      ],
    });
    prisma.client.findUnique.mockResolvedValue({
      id: "c1",
      trainerId: "t1",
    });
    prisma.exercise.findMany.mockResolvedValue([
      { id: "ex1", name: "Back Squat" },
    ]);
    prisma.workoutProgram.create.mockResolvedValue({ id: "prog1" });

    await service.createWorkoutFromTemplate("t1", "tmpl1", {
      clientId: "c1",
    });

    const createArg = prisma.workoutProgram.create.mock.calls[0][0];
    expect(createArg.data.days.create[0].exercises.create[0].customName).toBe(
      "Back Squat",
    );
  });

  it("rejects create-from-template when client missing", async () => {
    prisma.workoutTemplate.findUnique.mockResolvedValue(sampleTemplate);
    prisma.client.findUnique.mockResolvedValue(null);

    await expect(
      service.createWorkoutFromTemplate("t1", "tmpl1", { clientId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
