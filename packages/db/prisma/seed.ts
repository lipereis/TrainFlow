import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient, type ExperienceLevel } from "@prisma/client";

type SeedExercise = {
  name: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  category: string;
  equipment: string;
  defaultInstructions?: string;
  videoUrl?: string | null;
  alternativeIds?: string[];
};

type SeedTemplateExercise = {
  exerciseName: string;
  muscleGroup: string;
  category: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec?: number | null;
  weight?: number | null;
  weightUnit?: "KG" | "LB";
  method?: string;
  sortOrder?: number;
  observation?: string | null;
};

type SeedTemplateDay = {
  name: string;
  focus?: string | null;
  warmup?: string | null;
  cooldown?: string | null;
  observations?: string | null;
  sortOrder?: number;
  exercises: SeedTemplateExercise[];
};

type SeedTemplate = {
  name: string;
  goal?: string | null;
  daysPerWeek?: number | null;
  level?: ExperienceLevel | null;
  observations?: string | null;
  days: SeedTemplateDay[];
};

const prisma = new PrismaClient();

async function upsertExercise(ex: SeedExercise) {
  const existing = await prisma.exercise.findFirst({
    where: {
      trainerId: null,
      name: ex.name,
      primaryMuscle: ex.primaryMuscle,
    },
  });

  const data = {
    name: ex.name,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles ?? [],
    category: ex.category,
    equipment: ex.equipment,
    defaultInstructions: ex.defaultInstructions ?? "",
    videoUrl: ex.videoUrl ?? null,
    alternativeIds: ex.alternativeIds ?? [],
    trainerId: null as string | null,
  };

  if (existing) {
    return prisma.exercise.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.exercise.create({ data });
}

async function upsertSampleTemplate(
  template: SeedTemplate,
  exerciseIdByName: Map<string, string>,
) {
  const existing = await prisma.workoutTemplate.findFirst({
    where: {
      isSample: true,
      trainerId: null,
      name: template.name,
    },
  });

  const daysCreate = template.days.map((day, dayIndex) => ({
    name: day.name,
    focus: day.focus ?? null,
    warmup: day.warmup ?? null,
    cooldown: day.cooldown ?? null,
    observations: day.observations ?? null,
    sortOrder: day.sortOrder ?? dayIndex,
    exercises: {
      create: day.exercises.map((ex, exIndex) => {
        const exerciseId = exerciseIdByName.get(ex.exerciseName);
        if (!exerciseId) {
          throw new Error(
            `Template "${template.name}" references unknown exercise "${ex.exerciseName}"`,
          );
        }
        return {
          exerciseId,
          customName: ex.exerciseName,
          muscleGroup: ex.muscleGroup,
          category: ex.category,
          sets: ex.sets,
          repsMin: ex.repsMin,
          repsMax: ex.repsMax,
          weight: ex.weight ?? null,
          weightUnit: ex.weightUnit ?? "KG",
          restSec: ex.restSec ?? null,
          tempo: null,
          rpe: null,
          rir: null,
          method: ex.method ?? "Standard sets",
          sortOrder: ex.sortOrder ?? exIndex,
          observation: ex.observation ?? null,
          videoUrl: null,
          alternativeText: null,
        };
      }),
    },
  }));

  if (existing) {
    await prisma.templateDay.deleteMany({ where: { templateId: existing.id } });
    return prisma.workoutTemplate.update({
      where: { id: existing.id },
      data: {
        goal: template.goal ?? null,
        daysPerWeek: template.daysPerWeek ?? null,
        level: template.level ?? null,
        observations: template.observations ?? null,
        isSample: true,
        trainerId: null,
        days: { create: daysCreate },
      },
    });
  }

  return prisma.workoutTemplate.create({
    data: {
      name: template.name,
      goal: template.goal ?? null,
      daysPerWeek: template.daysPerWeek ?? null,
      level: template.level ?? null,
      observations: template.observations ?? null,
      isSample: true,
      trainerId: null,
      days: { create: daysCreate },
    },
  });
}

async function main() {
  const exercisesPath = join(__dirname, "data", "exercises.json");
  const exercises = JSON.parse(
    readFileSync(exercisesPath, "utf-8"),
  ) as SeedExercise[];

  if (exercises.length < 40) {
    throw new Error(
      `Expected ≥40 exercises in seed data, got ${exercises.length}`,
    );
  }

  let upsertedExercises = 0;
  for (const ex of exercises) {
    await upsertExercise(ex);
    upsertedExercises += 1;
  }
  console.log(`Seeded ${upsertedExercises} global exercises (trainerId=null)`);

  const globals = await prisma.exercise.findMany({
    where: { trainerId: null },
    select: { id: true, name: true },
  });
  const exerciseIdByName = new Map(globals.map((e) => [e.name, e.id]));

  const templatesPath = join(__dirname, "data", "templates.json");
  const templates = JSON.parse(
    readFileSync(templatesPath, "utf-8"),
  ) as SeedTemplate[];

  if (templates.length !== 5) {
    throw new Error(`Expected 5 sample templates, got ${templates.length}`);
  }

  let upsertedTemplates = 0;
  for (const template of templates) {
    await upsertSampleTemplate(template, exerciseIdByName);
    upsertedTemplates += 1;
  }
  console.log(
    `Seeded ${upsertedTemplates} sample templates (isSample=true, trainerId=null)`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
