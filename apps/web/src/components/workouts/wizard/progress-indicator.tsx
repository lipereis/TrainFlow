"use client";

import { useTranslations } from "next-intl";
import type { WizardStep } from "./types";

const STEP_KEYS = [
  { n: 1 as WizardStep, key: "stepClient" as const },
  { n: 2 as WizardStep, key: "stepProgram" as const },
  { n: 3 as WizardStep, key: "stepDays" as const },
  { n: 4 as WizardStep, key: "stepExercises" as const },
  { n: 5 as WizardStep, key: "stepReview" as const },
];

export function WizardProgress({ step }: { step: WizardStep }) {
  const t = useTranslations("wizard");

  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEP_KEYS.map((s, i) => {
        const done = s.n < step;
        const current = s.n === step;
        return (
          <li key={s.n} className="flex items-center gap-2">
            {i > 0 ? (
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
            ) : null}
            <span
              className={
                current
                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                  : done
                    ? "text-zinc-600 dark:text-zinc-300"
                    : "text-zinc-400 dark:text-zinc-500"
              }
            >
              <span
                className={`mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  current
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : done
                      ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                {s.n}
              </span>
              {t(s.key)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
