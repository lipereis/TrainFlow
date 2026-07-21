import { NextRequest } from "next/server";
import { createExerciseSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { exercisesService } from "@/server/exercises.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const sp = req.nextUrl.searchParams;
    return jsonOk(
      await exercisesService.list(trainerId, {
        q: sp.get("q") ?? undefined,
        muscle: sp.get("muscle") ?? undefined,
        category: sp.get("category") ?? undefined,
      }),
    );
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(createExerciseSchema, await req.json());
    return jsonOk(await exercisesService.create(trainerId, body), 201);
  });
}
