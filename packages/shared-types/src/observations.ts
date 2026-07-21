export const OBSERVATION_TEMPLATES = [
  "Maintain controlled execution on every rep; avoid momentum.",
  "Stop the set immediately if you feel sharp pain.",
  "Increase load only when all prescribed reps are completed with good form.",
  "Focus on a slow eccentric (3–4 seconds) on each rep.",
  "Keep rest periods strict; start the next set when the timer ends.",
  "Prioritize full range of motion over heavier weight.",
  "Leave 1–2 reps in reserve unless RPE/RIR indicates otherwise.",
  "Brace core before each rep; maintain neutral spine.",
] as const;

export type ObservationTemplate = (typeof OBSERVATION_TEMPLATES)[number];
