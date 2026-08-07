import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { WorkoutEditorMock } from "@/components/marketing/product-mocks";
import { Reveal } from "@/components/marketing/reveal";

export async function ProductRevealSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection
      id="product"
      tone="light"
      wide
      className="py-20 sm:py-28 lg:py-32"
    >
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {t("revealTitleLine1")}
          <br />
          {t("revealTitleLine2")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          {t("revealSubtitle")}
        </p>
      </Reveal>

      <Reveal delayMs={100} className="mx-auto mt-12 max-w-5xl sm:mt-16">
        <WorkoutEditorMock />
      </Reveal>
    </MarketingSection>
  );
}
