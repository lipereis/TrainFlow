import { NextRequest } from "next/server";
import { updateWorkoutSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonNoContent, jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    return jsonOk(await workoutsService.get(trainerId, ctx.params.id));
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(updateWorkoutSchema, await req.json());
    return jsonOk(await workoutsService.update(trainerId, ctx.params.id, body));
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    await workoutsService.remove(trainerId, ctx.params.id);
    return jsonNoContent();
  });
}
