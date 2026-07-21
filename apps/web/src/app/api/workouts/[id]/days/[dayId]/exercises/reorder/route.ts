import { NextRequest } from "next/server";
import { reorderBodySchema } from "@/app/api/_lib/workout-schemas";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string; dayId: string } };

export async function PUT(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(reorderBodySchema, await req.json());
    return jsonOk(
      await workoutsService.reorderExercises(
        trainerId,
        ctx.params.id,
        ctx.params.dayId,
        body.ids,
      ),
    );
  });
}
