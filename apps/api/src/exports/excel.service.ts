import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import {
  dayTotals,
  emptyDisplay,
  formatRepRange,
  formatRest,
  formatWeight,
  weeklySummary,
} from "@trainflow/workout-math";
import type { ExportDay, ExportPayload } from "./export.types";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

function sheetNameForDay(name: string, index: number, used: Set<string>): string {
  const base = name
    .replace(/[\\/*?:\[\]]/g, " ")
    .trim()
    .slice(0, 28) || `Day ${index + 1}`;
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    n += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function exerciseName(ex: ExportDay["exercises"][number]): string {
  return ex.customName?.trim() || "Exercise";
}

function fmtVol(v: number | null): string {
  return v === null ? "—" : String(Math.round(v));
}

@Injectable()
export class ExcelService {
  async build(payload: ExportPayload): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TrainFlow";
    workbook.created = payload.generatedAt ?? new Date();

    const { program } = payload;
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

    const summarySheet = workbook.addWorksheet("Summary", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    this.writeSummarySheet(summarySheet, payload, summary);

    const usedNames = new Set<string>(["summary"]);
    program.days.forEach((day, i) => {
      const name = sheetNameForDay(day.name, i, usedNames);
      const sheet = workbook.addWorksheet(name, {
        views: [{ state: "frozen", ySplit: 1 }],
      });
      this.writeDaySheet(sheet, day);
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private writeSummarySheet(
    sheet: ExcelJS.Worksheet,
    payload: ExportPayload,
    summary: ReturnType<typeof weeklySummary>,
  ) {
    const { program, trainerName, clientName, clientObservations } = payload;

    sheet.columns = [
      { header: "Field", key: "field", width: 28 },
      { header: "Value", key: "value", width: 48 },
    ];
    this.styleHeaderRow(sheet);

    const rows: [string, string][] = [
      ["Trainer", trainerName],
      ["Client", clientName],
      ["Program", program.name],
      ["Goal", emptyDisplay(program.goal)],
      ["Status", program.status],
      ["Level", emptyDisplay(program.level)],
      ["Start date", program.startDate.slice(0, 10)],
      ["End date", program.endDate ? program.endDate.slice(0, 10) : "—"],
      ["Days / week", String(program.daysPerWeek)],
      ["Location", emptyDisplay(program.location)],
      ["Equipment", emptyDisplay(program.equipment)],
      ["Program observations", emptyDisplay(program.observations)],
      ["Client observations", emptyDisplay(clientObservations)],
      ["", ""],
      ["Weekly sessions", String(summary.sessions)],
      ["Weekly total sets", String(summary.totalSets)],
      ["Weekly min volume", fmtVol(summary.minVolume)],
      ["Weekly max volume", fmtVol(summary.maxVolume)],
      [
        "Weekly est. duration (min)",
        String(summary.estimatedDurationMin),
      ],
    ];

    for (const [field, value] of rows) {
      const row = sheet.addRow({ field, value });
      row.getCell(1).font = { bold: Boolean(field) };
      row.getCell(2).alignment = { wrapText: true, vertical: "top" };
      if (field.toLowerCase().includes("observation")) {
        row.height = 45;
      }
    }

    sheet.addRow({});
    sheet.addRow({ field: "Sets by muscle", value: "" }).font = {
      bold: true,
    };
    const muscleEntries = Object.entries(summary.setsByMuscle).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    if (muscleEntries.length === 0) {
      sheet.addRow({ field: "—", value: "0" });
    } else {
      for (const [muscle, sets] of muscleEntries) {
        sheet.addRow({ field: muscle, value: String(sets) });
      }
    }
  }

  private writeDaySheet(sheet: ExcelJS.Worksheet, day: ExportDay) {
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

    sheet.columns = [
      { header: "Exercise", key: "exercise", width: 28 },
      { header: "Muscle", key: "muscle", width: 14 },
      { header: "Category", key: "category", width: 12 },
      { header: "Sets", key: "sets", width: 8 },
      { header: "Reps", key: "reps", width: 10 },
      { header: "Weight", key: "weight", width: 12 },
      { header: "Rest", key: "rest", width: 10 },
      { header: "Tempo", key: "tempo", width: 10 },
      { header: "RPE", key: "rpe", width: 8 },
      { header: "RIR", key: "rir", width: 8 },
      { header: "Method", key: "method", width: 16 },
      { header: "Observation", key: "observation", width: 36 },
      { header: "Alternative", key: "alternative", width: 22 },
    ];
    this.styleHeaderRow(sheet);

    for (const ex of day.exercises) {
      const row = sheet.addRow({
        exercise: exerciseName(ex),
        muscle: ex.muscleGroup,
        category: ex.category,
        sets: ex.sets,
        reps: formatRepRange(ex.repsMin, ex.repsMax),
        weight: formatWeight(ex.weight, ex.weightUnit),
        rest: formatRest(ex.restSec),
        tempo: emptyDisplay(ex.tempo),
        rpe: emptyDisplay(ex.rpe),
        rir: emptyDisplay(ex.rir),
        method: ex.method,
        observation: emptyDisplay(ex.observation),
        alternative: emptyDisplay(ex.alternativeText),
      });
      row.eachCell((cell) => {
        cell.border = THIN_BORDER;
        cell.alignment = { wrapText: true, vertical: "top" };
      });
      if (ex.observation) {
        row.height = 36;
      }
    }

    sheet.addRow({});
    const meta: [string, string][] = [
      ["Day", day.name],
      ["Focus", emptyDisplay(day.focus)],
      [
        "Est. duration (min)",
        emptyDisplay(day.estimatedDurationMin ?? totals.estimatedDurationMin),
      ],
      ["Warm-up", emptyDisplay(day.warmup)],
      ["Cool-down", emptyDisplay(day.cooldown)],
      ["Day observations", emptyDisplay(day.observations)],
      ["Exercise count", String(totals.exerciseCount)],
      ["Total sets", String(totals.totalSets)],
      ["Min / max reps", `${totals.minReps} / ${totals.maxReps}`],
      ["Min volume", fmtVol(totals.minVolume)],
      ["Max volume", fmtVol(totals.maxVolume)],
      ["Est. duration calc (min)", String(totals.estimatedDurationMin)],
    ];
    for (const [label, value] of meta) {
      const row = sheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(2).alignment = { wrapText: true, vertical: "top" };
      if (label.toLowerCase().includes("observation") || label === "Warm-up") {
        row.height = 40;
      }
    }
  }

  private styleHeaderRow(sheet: ExcelJS.Worksheet) {
    const header = sheet.getRow(1);
    header.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    header.height = 22;
  }
}
