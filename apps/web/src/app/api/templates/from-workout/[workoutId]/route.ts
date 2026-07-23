import { NextRequest } from "next/server";
import { createTemplateFromWorkoutSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { templatesService } from "@/server/templates.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ workoutId: string }>; };

export async function POST(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(
      createTemplateFromWorkoutSchema,
      (await req.json().catch(() => ({}))) ?? {},
    );
    return jsonOk(
      await templatesService.createFromWorkout(
        trainerId,
        (await ctx.params).workoutId,
        body,
      ),
      201,
    );
  });
}
