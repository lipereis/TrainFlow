import { NextRequest } from "next/server";
import { createWorkoutSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;
    return jsonOk(await workoutsService.list(trainerId, clientId));
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(createWorkoutSchema, await req.json());
    return jsonOk(await workoutsService.create(trainerId, body), 201);
  });
}
