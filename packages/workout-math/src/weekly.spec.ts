import { estimateDayDurationMin } from "./duration";
import { dayTotals, weeklySummary } from "./weekly";

describe("estimateDayDurationMin", () => {
  it("estimates duration from work, rest, and transitions", () => {
    const exercises = [
      { sets: 3, repsMin: 8, repsMax: 12, restSec: 90 },
      { sets: 3, repsMin: 8, repsMax: 12, restSec: 90 },
    ];
    expect(estimateDayDurationMin(exercises)).toBe(10);
  });
});

describe("dayTotals", () => {
  it("aggregates reps, sets, and volume for a day", () => {
    expect(
      dayTotals([
        {
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          weight: 20,
          restSec: 90,
          muscleGroup: "Chest",
        },
        {
          sets: 4,
          repsMin: 6,
          repsMax: 8,
          weight: 60,
          restSec: 120,
          muscleGroup: "Back",
        },
      ]),
    ).toEqual({
      exerciseCount: 2,
      totalSets: 7,
      minReps: 48,
      maxReps: 68,
      minVolume: 1920,
      maxVolume: 2640,
      estimatedDurationMin: 12,
    });
  });

  it("sums only available volumes when weight is missing", () => {
    const totals = dayTotals([
      { sets: 3, repsMin: 8, repsMax: 12, weight: 20, muscleGroup: "Chest" },
      { sets: 3, repsMin: 8, repsMax: 12, weight: null, muscleGroup: "Back" },
    ]);
    expect(totals.minVolume).toBe(480);
    expect(totals.maxVolume).toBe(720);
  });
});

describe("weeklySummary", () => {
  it("rolls up sessions, sets, volume, and muscle groups", () => {
    expect(
      weeklySummary([
        {
          exercises: [
            {
              sets: 3,
              repsMin: 8,
              repsMax: 12,
              weight: 20,
              muscleGroup: "Chest",
            },
          ],
        },
        {
          exercises: [
            {
              sets: 4,
              repsMin: 6,
              repsMax: 8,
              weight: 60,
              muscleGroup: "Chest",
            },
          ],
        },
      ]),
    ).toEqual({
      sessions: 2,
      totalSets: 7,
      minVolume: 1920,
      maxVolume: 2640,
      estimatedDurationMin: 3,
      setsByMuscle: { Chest: 7 },
    });
  });
});
