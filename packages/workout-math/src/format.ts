const EM_DASH = "—";

export function formatRepRange(min: number, max: number): string {
  return `${min}–${max}`;
}

export function formatRest(sec: number | null): string {
  if (sec === null) {
    return EM_DASH;
  }
  return `${sec} sec`;
}

export function formatWeight(
  weight: number | null,
  unit: "KG" | "LB",
): string {
  if (weight === null) {
    return EM_DASH;
  }
  const label = unit === "KG" ? "kg" : "lb";
  return `${weight} ${label}`;
}

export function emptyDisplay(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return EM_DASH;
  }
  return String(value);
}
