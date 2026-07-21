
import PDFDocument from "pdfkit";
import {
  dayTotals,
  emptyDisplay,
  formatRepRange,
  formatRest,
  formatWeight,
  weeklySummary,
} from "@trainflow/workout-math";
import type { ExportDay, ExportPayload } from "./export.types";

function fmtVol(v: number | null): string {
  return v === null ? "—" : String(Math.round(v));
}

function exerciseName(ex: ExportDay["exercises"][number]): string {
  return ex.customName?.trim() || "Exercise";
}

export class PdfService {
  async build(payload: ExportPayload): Promise<Buffer> {
    const doc = new PDFDocument({
      margin: 48,
      size: "A4",
      info: {
        Title: `TrainFlow — ${payload.program.name}`,
        Author: payload.trainerName,
        Creator: "TrainFlow",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    this.writeDocument(doc, payload);
    doc.end();
    return done;
  }

  private writeDocument(doc: PDFKit.PDFDocument, payload: ExportPayload) {
    const { program, trainerName, clientName, clientObservations } = payload;
    const generatedAt = payload.generatedAt ?? new Date();
    const summary = weeklySummary(
      program.days.map((d) => ({
        exercises: d.exercises.map((e) => ({
          sets: e.sets,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
          weight: e.weight,
          restSec: e.restSec,
          muscleGroup: e.muscleGroup,
        })),
      })),
    );

    doc
      .fontSize(22)
      .fillColor("#111827")
      .text("TrainFlow", { align: "left" });
    doc.moveDown(0.3);
    doc
      .fontSize(14)
      .fillColor("#374151")
      .text(program.name);
    doc.moveDown(0.6);

    doc.fontSize(10).fillColor("#111827");
    this.line(doc, "Trainer", trainerName);
    this.line(doc, "Client", clientName);
    this.line(doc, "Goal", emptyDisplay(program.goal));
    this.line(doc, "Status", program.status);
    this.line(doc, "Level", emptyDisplay(program.level));
    this.line(doc, "Start", program.startDate.slice(0, 10));
    this.line(
      doc,
      "End",
      program.endDate ? program.endDate.slice(0, 10) : "—",
    );
    this.line(doc, "Days / week", String(program.daysPerWeek));
    this.line(doc, "Location", emptyDisplay(program.location));
    this.line(doc, "Equipment", emptyDisplay(program.equipment));
    doc.moveDown(0.4);
    this.block(doc, "Program observations", program.observations);
    this.block(doc, "Client observations", clientObservations);

    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#111827").text("Weekly summary", {
      underline: true,
    });
    doc.moveDown(0.3);
    doc.fontSize(10);
    this.line(doc, "Sessions", String(summary.sessions));
    this.line(doc, "Total sets", String(summary.totalSets));
    this.line(doc, "Min volume", fmtVol(summary.minVolume));
    this.line(doc, "Max volume", fmtVol(summary.maxVolume));
    this.line(
      doc,
      "Est. duration (min)",
      String(summary.estimatedDurationMin),
    );

    const muscles = Object.entries(summary.setsByMuscle).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    if (muscles.length > 0) {
      doc.moveDown(0.3);
      doc.text("Sets by muscle:");
      for (const [muscle, sets] of muscles) {
        doc.text(`  • ${muscle}: ${sets}`);
      }
    }

    program.days.forEach((day, index) => {
      if (index > 0 || doc.y > 120) {
        doc.addPage();
      } else {
        doc.moveDown(1);
      }
      this.writeDay(doc, day);
    });

    doc.moveDown(1);
    doc
      .fontSize(9)
      .fillColor("#6B7280")
      .text(`Generated ${generatedAt.toISOString().slice(0, 10)} · TrainFlow`, {
        align: "left",
      });
  }

  private writeDay(doc: PDFKit.PDFDocument, day: ExportDay) {
    const totals = dayTotals(
      day.exercises.map((e) => ({
        sets: e.sets,
        repsMin: e.repsMin,
        repsMax: e.repsMax,
        weight: e.weight,
        restSec: e.restSec,
        muscleGroup: e.muscleGroup,
      })),
    );

    doc.fontSize(14).fillColor("#111827").text(day.name, { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    this.line(doc, "Focus", emptyDisplay(day.focus));
    this.line(
      doc,
      "Est. duration (min)",
      emptyDisplay(day.estimatedDurationMin ?? totals.estimatedDurationMin),
    );
    this.block(doc, "Warm-up", day.warmup);
    this.block(doc, "Cool-down", day.cooldown);
    this.block(doc, "Day observations", day.observations);
    doc.moveDown(0.4);

    const colX = [48, 190, 250, 290, 340, 400, 460];
    const headers = ["Exercise", "Muscle", "Sets", "Reps", "Weight", "Rest", "Method"];
    this.ensureSpace(doc, 40);
    const y0 = doc.y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
    headers.forEach((h, i) => {
      const width = colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 90;
      doc.text(h, colX[i], y0, { width, lineBreak: false });
    });
    doc.y = y0 + 14;
    doc
      .moveTo(48, doc.y)
      .lineTo(547, doc.y)
      .strokeColor("#D1D5DB")
      .stroke();
    doc.moveDown(0.3);
    doc.font("Helvetica").fillColor("#111827");

    for (const ex of day.exercises) {
      this.ensureSpace(doc, 36);
      const rowY = doc.y;
      const cells = [
        exerciseName(ex),
        ex.muscleGroup,
        String(ex.sets),
        formatRepRange(ex.repsMin, ex.repsMax),
        formatWeight(ex.weight, ex.weightUnit),
        formatRest(ex.restSec),
        ex.method,
      ];
      let maxH = 12;
      cells.forEach((text, i) => {
        const width = colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 90;
        const h = doc.heightOfString(text, { width });
        maxH = Math.max(maxH, h);
        doc.text(text, colX[i], rowY, { width });
      });
      doc.y = rowY + maxH + 4;
      if (ex.observation) {
        doc
          .fontSize(8)
          .fillColor("#4B5563")
          .text(`Obs: ${ex.observation}`, 48, doc.y, { width: 500 });
        doc.fontSize(9).fillColor("#111827");
        doc.moveDown(0.2);
      }
    }

    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#111827");
    doc.text(
      `Totals — exercises: ${totals.exerciseCount} · sets: ${totals.totalSets} · reps: ${totals.minReps}–${totals.maxReps} · volume: ${fmtVol(totals.minVolume)}–${fmtVol(totals.maxVolume)} · ~${totals.estimatedDurationMin} min`,
    );
  }

  private line(doc: PDFKit.PDFDocument, label: string, value: string) {
    doc.text(`${label}: ${value}`);
  }

  private block(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string | null | undefined,
  ) {
    if (!value?.trim()) {
      doc.text(`${label}: —`);
      return;
    }
    doc.text(`${label}:`);
    doc.text(value, { indent: 12 });
  }

  private ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
    if (doc.y + needed > doc.page.height - 48) {
      doc.addPage();
    }
  }
}

export const pdfService = new PdfService();
