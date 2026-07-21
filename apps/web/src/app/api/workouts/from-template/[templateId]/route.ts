import { NextRequest } from "next/server";
import { createWorkoutFromTemplateSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { templatesService } from "@/server/templates.service";
import { workoutsService } from "@/server/workouts.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { templateId: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(createWorkoutFromTemplateSchema, await req.json());
    const programId = await templatesService.createWorkoutFromTemplate(
      trainerId,
      ctx.params.templateId,
      body,
    );
    return jsonOk(await workoutsService.get(trainerId, programId), 201);
  });
}
