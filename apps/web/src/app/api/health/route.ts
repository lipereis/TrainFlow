import { prisma } from "@/server/prisma";
import { jsonOk, withHandler } from "@/server/http";

export const runtime = "nodejs";

export async function GET() {
  return withHandler(async () => {
    await prisma.$queryRaw`SELECT 1`;
    return jsonOk({ ok: true, db: true });
  });
}
