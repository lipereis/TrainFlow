import { NextRequest } from "next/server";
import { updateDaySchema } from "@/app/api/_lib/workout-schemas";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonNoContent, jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string; dayId: string } };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(updateDaySchema, await req.json());
    return jsonOk(
      await workoutsService.updateDay(
        trainerId,
        ctx.params.id,
        ctx.params.dayId,
        body,
      ),
    );
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    await workoutsService.removeDay(
      trainerId,
      ctx.params.id,
      ctx.params.dayId,
    );
    return jsonNoContent();
  });
}
