import { getTranslations } from "next-intl/server";
import { Atmosphere } from "@/components/marketing/atmosphere";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { WorkoutEditorMock } from "@/components/marketing/product-mocks";
import { Reveal } from "@/components/marketing/reveal";

export async function BuilderShowcaseSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection tone="dark" wide className="py-20 sm:py-28 lg:py-32">
      <Atmosphere />
      <div className="relative grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
            {t("builderEyebrow")}
          </p>
          <h2 className="mkt-heading mt-4 text-3xl text-foreground sm:text-4xl lg:text-5xl">
            {t("builderTitle")}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("builderSubtitle")}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li>{t("builderPoint1")}</li>
            <li>{t("builderPoint2")}</li>
            <li>{t("builderPoint3")}</li>
          </ul>
        </Reveal>

        <Reveal delayMs={100} className="min-w-0">
          <WorkoutEditorMock animate />
        </Reveal>
      </div>
    </MarketingSection>
  );
}
