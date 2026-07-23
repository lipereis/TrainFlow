import { NextRequest } from "next/server";
import { requireTrainerId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { jsonOk, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; dayId: string }>; };

export async function POST(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    return jsonOk(
      await workoutsService.duplicateDay(
        trainerId,
        (await ctx.params).id,
        (await ctx.params).dayId,
      ),
      201,
    );
  });
}
