import { getTranslations } from "next-intl/server";
import { Atmosphere } from "@/components/marketing/atmosphere";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { WorkoutEditorMock } from "@/components/marketing/product-mocks";
import { Reveal } from "@/components/marketing/reveal";

export async function BuilderShowcaseSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection
      tone="dark"
      wide
      className="py-20 sm:py-28 lg:py-32"
    >
      <Atmosphere />
      <div className="relative grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-mkt-accent">
            {t("builderEyebrow")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.08]">
            {t("builderTitle")}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-mkt-dark-muted sm:text-lg">
            {t("builderSubtitle")}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/75">
            <li>{t("builderPoint1")}</li>
            <li>{t("builderPoint2")}</li>
            <li>{t("builderPoint3")}</li>
          </ul>
        </Reveal>

        <Reveal delayMs={100} className="min-w-0">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-10 bg-mkt-accent/15 blur-3xl"
            />
            <WorkoutEditorMock dark animate />
          </div>
        </Reveal>
      </div>
    </MarketingSection>
  );
}
