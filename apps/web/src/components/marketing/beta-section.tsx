import { getTranslations } from "next-intl/server";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";

export async function BetaSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection tone="lightMuted" className="py-20 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-mkt-accent">
          {t("betaEyebrow")}
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-mkt-light-fg sm:text-4xl">
          {t("betaTitle")}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-mkt-light-muted-fg sm:text-lg">
          {t("betaBody")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MarketingCta href="/sign-up" variant="accentOnLight" size="lg">
            {t("betaCta")}
          </MarketingCta>
        </div>
        <p className="mt-6 text-sm text-mkt-light-muted-fg">{t("betaNote")}</p>
      </Reveal>
    </MarketingSection>
  );
}
