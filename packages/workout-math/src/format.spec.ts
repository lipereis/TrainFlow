import { formatRepRange, formatRest, formatWeight } from "./format";

describe("format", () => {
  it("formats rep range with en-dash", () => {
    expect(formatRepRange(8, 12)).toBe("8–12");
  });
  it("formats rest and weight", () => {
    expect(formatRest(90)).toBe("90 sec");
    expect(formatRest(null)).toBe("—");
    expect(formatWeight(20, "KG")).toBe("20 kg");
    expect(formatWeight(null, "KG")).toBe("—");
  });
});
