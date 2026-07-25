import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { WorkoutEditorMock } from "@/components/marketing/product-mocks";
import { Reveal } from "@/components/marketing/reveal";

const BEFORE = ["before1", "before2", "before3", "before4", "before5"] as const;
const AFTER = ["after1", "after2", "after3", "after4", "after5"] as const;

export async function CompareSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection tone="light" className="py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-mkt-light-fg sm:text-4xl">
          {t("compareTitle")}
        </h2>
        <p className="mt-4 text-base text-mkt-light-muted-fg sm:text-lg">
          {t("compareSubtitle")}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Reveal>
          <div className="h-full rounded-3xl border border-black/8 bg-mkt-light-muted/80 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mkt-light-muted-fg">
              {t("compareBeforeLabel")}
            </p>
            <ul className="mt-6 space-y-4">
              {BEFORE.map((key) => (
                <li
                  key={key}
                  className="flex gap-3 text-sm leading-relaxed text-mkt-light-muted-fg"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mkt-light-muted-fg/50"
                    aria-hidden
                  />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="h-full rounded-3xl border border-mkt-accent/25 bg-white p-6 shadow-card sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mkt-accent">
              {t("compareAfterLabel")}
            </p>
            <ul className="mt-6 space-y-4">
              {AFTER.map((key) => (
                <li
                  key={key}
                  className="flex gap-3 text-sm leading-relaxed text-mkt-light-fg"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mkt-accent"
                    aria-hidden
                  />
                  {t(key)}
                </li>
              ))}
            </ul>
            <div className="mt-8 hidden sm:block">
              <WorkoutEditorMock className="shadow-none" />
            </div>
          </div>
        </Reveal>
      </div>
    </MarketingSection>
  );
}
