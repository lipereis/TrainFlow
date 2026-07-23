import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkoutExport } from "@/server/export-access";
import { excelService } from "@/server/excel.service";
import { loadExportPayload } from "@/server/export-payload";
import { toErrorResponse } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }>; };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { trainerId } = await authorizeWorkoutExport((await ctx.params).id);
    const payload = await loadExportPayload(trainerId, (await ctx.params).id);
    const buffer = await excelService.build(payload);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="workout-${(await ctx.params).id}.xlsx"`,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
