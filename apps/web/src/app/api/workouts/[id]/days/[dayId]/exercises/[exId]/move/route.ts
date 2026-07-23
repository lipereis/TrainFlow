import { NextRequest } from "next/server";
import { moveExerciseSchema } from "@/app/api/_lib/workout-schemas";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; dayId: string; exId: string }>; };

export async function POST(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(moveExerciseSchema, await req.json());
    return jsonOk(
      await workoutsService.moveExercise(
        trainerId,
        (await ctx.params).id,
        (await ctx.params).dayId,
        (await ctx.params).exId,
        body.targetDayId,
        body.sortOrder,
      ),
    );
  });
}
