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
              <span className="text-muted-foreground">/</span>
            ) : null}
            <span
              className={
                current
                  ? "font-medium text-foreground"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground"
              }
            >
              <span
                className={`mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  current
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-muted text-foreground"
                      : "bg-muted text-muted-foreground"
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
