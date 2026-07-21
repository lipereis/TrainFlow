import { NextRequest } from "next/server";
import { workoutExerciseSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string; dayId: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(workoutExerciseSchema, await req.json());
    return jsonOk(
      await workoutsService.addExercise(
        trainerId,
        ctx.params.id,
        ctx.params.dayId,
        body,
      ),
      201,
    );
  });
}
