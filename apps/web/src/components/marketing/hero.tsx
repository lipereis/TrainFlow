import { getTranslations } from "next-intl/server";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { WorkoutEditorMock } from "@/components/marketing/product-mocks";
import { Reveal } from "@/components/marketing/reveal";

export async function Hero() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection tone="light" wide className="pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Reveal>
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary sm:text-sm">
            {t("heroEyebrow")}
          </p>
          <h1 className="mkt-heading max-w-xl text-4xl text-foreground sm:text-5xl lg:text-[3.8rem]">
            <span className="block">{t("heroTitleLine1")}</span>
            <span className="block">{t("heroTitleLine2")}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <MarketingCta
              href="/sign-up"
              variant="accent"
              size="lg"
              className="w-full justify-center sm:w-auto"
            >
              {t("heroCtaPrimary")}
            </MarketingCta>
            <MarketingCta
              href="#how"
              variant="ghostLight"
              size="lg"
              className="w-full justify-center sm:w-auto"
            >
              {t("heroCtaSecondary")}
            </MarketingCta>
          </div>
        </Reveal>

        <Reveal delayMs={120} className="min-w-0">
          <WorkoutEditorMock />
        </Reveal>
      </div>
    </MarketingSection>
  );
}
