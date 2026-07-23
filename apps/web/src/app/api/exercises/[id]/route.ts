import { NextRequest } from "next/server";
import { createExerciseSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { exercisesService } from "@/server/exercises.service";
import { jsonNoContent, jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

const updateExerciseSchema = createExerciseSchema.partial();

type Ctx = { params: Promise<{ id: string }>; };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(updateExerciseSchema, await req.json());
    return jsonOk(await exercisesService.update(trainerId, (await ctx.params).id, body));
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    await exercisesService.remove(trainerId, (await ctx.params).id);
    return jsonNoContent();
  });
}
