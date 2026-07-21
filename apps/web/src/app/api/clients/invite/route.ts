import { NextRequest } from "next/server";
import { inviteClientSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { clientsService } from "@/server/clients.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(inviteClientSchema, await req.json());
    return jsonOk(await clientsService.invite(trainerId, body), 201);
  });
}
