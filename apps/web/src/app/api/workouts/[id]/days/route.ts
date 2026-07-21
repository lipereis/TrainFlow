import { NextRequest } from "next/server";
import { workoutDaySchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(workoutDaySchema, await req.json());
    return jsonOk(
      await workoutsService.addDay(trainerId, ctx.params.id, body),
      201,
    );
  });
}
