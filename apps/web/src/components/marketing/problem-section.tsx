import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";

const PAIN_KEYS = ["problem1", "problem2", "problem3", "problem4", "problem5"] as const;

export async function ProblemSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection tone="light" className="py-20 sm:py-24">
      <Reveal className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("problemTitleLine1")}
          <br />
          {t("problemTitleLine2")}
        </h2>
        <p className="mt-5 text-base text-muted-foreground sm:text-lg">
          {t("problemSubtitle")}
        </p>
      </Reveal>

      <ul className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {PAIN_KEYS.map((key, i) => (
          <Reveal key={key} delayMs={i * 60}>
            <li className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-foreground shadow-sm">
              {t(key)}
            </li>
          </Reveal>
        ))}
      </ul>
    </MarketingSection>
  );
}
