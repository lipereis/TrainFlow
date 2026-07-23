import { NextRequest } from "next/server";
import { requireTrainerId } from "@/server/auth";
import { clientsService } from "@/server/clients.service";
import { jsonOk, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }>; };

export async function POST(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    return jsonOk(await clientsService.resendInvite(trainerId, (await ctx.params).id));
  });
}
