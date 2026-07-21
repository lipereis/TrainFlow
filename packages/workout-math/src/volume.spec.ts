import { exerciseVolume } from "./volume";

describe("exerciseVolume", () => {
  it("computes min/max volume when weight present", () => {
    expect(
      exerciseVolume({ sets: 3, repsMin: 8, repsMax: 12, weight: 20 }),
    ).toEqual({
      minReps: 24,
      maxReps: 36,
      minVolume: 480,
      maxVolume: 720,
    });
  });

  it("returns null volumes when weight missing", () => {
    const r = exerciseVolume({
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      weight: null,
    });
    expect(r.minVolume).toBeNull();
    expect(r.maxVolume).toBeNull();
  });
});
