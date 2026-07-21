import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

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

async function main() {
  const filePath = join(__dirname, "data", "exercises.json");
  const exercises = JSON.parse(
    readFileSync(filePath, "utf-8"),
  ) as SeedExercise[];

  if (exercises.length < 40) {
    throw new Error(
      `Expected ≥40 exercises in seed data, got ${exercises.length}`,
    );
  }

  let upserted = 0;
  for (const ex of exercises) {
    await upsertExercise(ex);
    upserted += 1;
  }

  console.log(`Seeded ${upserted} global exercises (trainerId=null)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
