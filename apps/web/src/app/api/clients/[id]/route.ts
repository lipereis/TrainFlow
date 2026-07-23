import { NextRequest } from "next/server";
import { updateClientSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { clientsService } from "@/server/clients.service";
import { jsonNoContent, jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }>; };

export async function GET(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    return jsonOk(await clientsService.get(trainerId, (await ctx.params).id));
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(updateClientSchema, await req.json());
    return jsonOk(await clientsService.update(trainerId, (await ctx.params).id, body));
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    await clientsService.remove(trainerId, (await ctx.params).id);
    return jsonNoContent();
  });
}
