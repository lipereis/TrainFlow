import { getTranslations } from "next-intl/server";
import { Atmosphere } from "@/components/marketing/atmosphere";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { WorkoutEditorMock } from "@/components/marketing/product-mocks";
import { Reveal } from "@/components/marketing/reveal";

export async function Hero() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection
      tone="dark"
      wide
      className="pb-16 pt-28 sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-36"
    >
      <Atmosphere />
      <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-mkt-accent sm:text-sm">
            {t("heroEyebrow")}
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.05]">
            <span className="block">{t("heroTitleLine1")}</span>
            <span className="block text-white/90">{t("heroTitleLine2")}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-mkt-dark-muted sm:mt-6 sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <MarketingCta href="/sign-up" variant="accent" size="lg" className="w-full justify-center sm:w-auto">
              {t("heroCtaPrimary")}
            </MarketingCta>
            <MarketingCta
              href="#how"
              variant="ghostDark"
              size="lg"
              className="w-full justify-center sm:w-auto"
            >
              {t("heroCtaSecondary")}
            </MarketingCta>
          </div>
        </Reveal>

        <Reveal delayMs={120} className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rotate-[-4deg] rounded-[2rem] bg-mkt-accent/20 blur-2xl sm:-inset-10"
          />
          <div className="mkt-parallax origin-center scale-[0.98] sm:rotate-[-2deg] sm:scale-100">
            <WorkoutEditorMock dark />
          </div>
        </Reveal>
      </div>
    </MarketingSection>
  );
}
