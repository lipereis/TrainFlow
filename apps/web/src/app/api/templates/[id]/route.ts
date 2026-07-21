import { NextRequest } from "next/server";
import { requireTrainerId } from "@/server/auth";
import { templatesService } from "@/server/templates.service";
import { jsonOk, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    return jsonOk(await templatesService.get(trainerId, ctx.params.id));
  });
}
