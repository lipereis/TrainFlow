import { getTranslations } from "next-intl/server";
import { ExportDocsMock } from "@/components/marketing/product-mocks";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";

export async function ExportShowcaseSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection tone="light" className="py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t("exportTitleLine1")}
          <br />
          {t("exportTitleLine2")}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          {t("exportSubtitle")}
        </p>
      </Reveal>

      <Reveal delayMs={80} className="mx-auto mt-12 max-w-4xl sm:mt-16">
        <ExportDocsMock />
      </Reveal>
    </MarketingSection>
  );
}
