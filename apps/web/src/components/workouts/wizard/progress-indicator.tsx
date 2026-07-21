"use client";

import type { WizardStep } from "./types";

const STEPS: { n: WizardStep; label: string }[] = [
  { n: 1, label: "Client" },
  { n: 2, label: "Program" },
  { n: 3, label: "Days" },
  { n: 4, label: "Exercises" },
  { n: 5, label: "Review" },
];

export function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((s, i) => {
        const done = s.n < step;
        const current = s.n === step;
        return (
          <li key={s.n} className="flex items-center gap-2">
            {i > 0 ? <span className="text-zinc-300">/</span> : null}
            <span
              className={
                current
                  ? "font-medium text-zinc-900"
                  : done
                    ? "text-zinc-600"
                    : "text-zinc-400"
              }
            >
              <span
                className={`mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  current
                    ? "bg-zinc-900 text-white"
                    : done
                      ? "bg-zinc-200 text-zinc-700"
                      : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {s.n}
              </span>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
