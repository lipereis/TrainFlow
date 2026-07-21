import { ExcelService } from "./excel.service";
import type { ExportPayload } from "./export.types";
import ExcelJS from "exceljs";

describe("ExcelService", () => {
  const service = new ExcelService();

  const sample: ExportPayload = {
    trainerName: "Alex Coach",
    clientName: "Jordan Client",
    clientObservations: "Knees sensitive on deep flexion",
    program: {
      name: "Strength Block A",
      goal: "Hypertrophy",
      startDate: "2026-07-01T00:00:00.000Z",
      endDate: "2026-08-01T00:00:00.000Z",
      daysPerWeek: 3,
      level: "INTERMEDIATE",
      location: "Gym",
      equipment: "Full gym",
      observations: "Progressive overload weekly",
      status: "ACTIVE",
      days: [
        {
          name: "Day A — Push",
          focus: "Chest / shoulders",
          estimatedDurationMin: 60,
          warmup: "5 min bike",
          cooldown: "Stretch",
          observations: "Keep RPE ≤ 8",
          exercises: [
            {
              customName: "Bench Press",
              muscleGroup: "Chest",
              category: "Compound",
              sets: 4,
              repsMin: 6,
              repsMax: 8,
              weight: 80,
              weightUnit: "KG",
              restSec: 120,
              tempo: "3010",
              rpe: 7.5,
              rir: 2,
              method: "Standard sets",
              observation: "Touch chest lightly",
              alternativeText: "DB press",
            },
            {
              customName: "Overhead Press",
              muscleGroup: "Shoulders",
              category: "Compound",
              sets: 3,
              repsMin: 8,
              repsMax: 10,
              weight: 40,
              weightUnit: "KG",
              restSec: 90,
              tempo: null,
              rpe: null,
              rir: null,
              method: "Standard sets",
              observation: null,
              alternativeText: null,
            },
          ],
        },
        {
          name: "Day B — Pull",
          focus: "Back",
          estimatedDurationMin: null,
          warmup: null,
          cooldown: null,
          observations: null,
          exercises: [
            {
              customName: "Lat Pulldown",
              muscleGroup: "Lats",
              category: "Compound",
              sets: 3,
              repsMin: 10,
              repsMax: 12,
              weight: null,
              weightUnit: "KG",
              restSec: 75,
              tempo: null,
              rpe: null,
              rir: null,
              method: "Standard sets",
              observation: null,
              alternativeText: null,
            },
          ],
        },
      ],
    },
    generatedAt: new Date("2026-07-20T12:00:00.000Z"),
  };

  it("builds a non-empty xlsx buffer with Summary + day sheets", async () => {
    const buffer = await service.build(sample);
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    // exceljs Buffer typings clash with Node 22 Buffer generics
    await workbook.xlsx.load(buffer as never);
    const names = workbook.worksheets.map((ws) => ws.name);
    expect(names[0]).toBe("Summary");
    expect(names).toContain("Day A — Push");
    expect(names).toContain("Day B — Pull");
    expect(names).toHaveLength(3);
  });
});
