import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkoutExport } from "@/server/export-access";
import { pdfService } from "@/server/pdf.service";
import { loadExportPayload } from "@/server/export-payload";
import { toErrorResponse } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { trainerId } = await authorizeWorkoutExport(ctx.params.id);
    const payload = await loadExportPayload(trainerId, ctx.params.id);
    const buffer = await pdfService.build(payload);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="workout-${ctx.params.id}.pdf"`,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
