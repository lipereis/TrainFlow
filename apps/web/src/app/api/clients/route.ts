import { NextRequest } from "next/server";
import { createClientSchema } from "@trainflow/shared-types";
import { requireTrainerId } from "@/server/auth";
import { clientsService } from "@/server/clients.service";
import { jsonOk, parseOrThrow, withHandler } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    return jsonOk(await clientsService.list(trainerId, q));
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const body = parseOrThrow(createClientSchema, await req.json());
    return jsonOk(await clientsService.create(trainerId, body), 201);
  });
}
