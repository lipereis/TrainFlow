import { getTranslations } from "next-intl/server";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";

export async function FinalCtaSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection tone="dark" className="py-20 sm:py-28">
      <Reveal className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.1]">
          {t("finalTitleLine1")}
          <br />
          {t("finalTitleLine2")}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          {t("finalSubtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MarketingCta href="/sign-up" variant="accent" size="lg">
            {t("finalCta")}
          </MarketingCta>
          <MarketingCta href="/sign-in" variant="linkLight" size="lg">
            {t("finalSignIn")}
          </MarketingCta>
        </div>
      </Reveal>
    </MarketingSection>
  );
}
