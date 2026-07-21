import { jsonOk, withHandler } from "@/server/http";

export const runtime = "nodejs";

export async function GET() {
  return withHandler(async () => jsonOk({ ok: true }));
}
