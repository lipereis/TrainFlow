import { NextRequest } from "next/server";
import { updateExerciseSchema } from "@/app/api/_lib/workout-schemas";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonNoContent, jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; dayId: string; exId: string }>; };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(updateExerciseSchema, await req.json());
    return jsonOk(
      await workoutsService.updateExercise(
        trainerId,
        (await ctx.params).id,
        (await ctx.params).dayId,
        (await ctx.params).exId,
        body,
      ),
    );
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    await workoutsService.removeExercise(
      trainerId,
      (await ctx.params).id,
      (await ctx.params).dayId,
      (await ctx.params).exId,
    );
    return jsonNoContent();
  });
}
