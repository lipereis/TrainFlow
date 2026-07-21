import { NextRequest } from "next/server";
import { requireTrainerId } from "@/server/auth";
import { templatesService } from "@/server/templates.service";
import { jsonOk, withHandler } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const sp = req.nextUrl.searchParams;
    return jsonOk(
      await templatesService.list(trainerId, {
        q: sp.get("q") ?? undefined,
        goal: sp.get("goal") ?? undefined,
        daysPerWeek: sp.get("daysPerWeek") ?? undefined,
      }),
    );
  });
}
