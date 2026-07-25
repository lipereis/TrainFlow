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
        <h2 className="text-3xl font-semibold tracking-tight text-mkt-light-fg sm:text-4xl lg:text-5xl lg:leading-[1.1]">
          {t("revealTitleLine1")}
          <br />
          {t("revealTitleLine2")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-mkt-light-muted-fg sm:text-lg">
          {t("revealSubtitle")}
        </p>
      </Reveal>

      <Reveal delayMs={100} className="mx-auto mt-12 max-w-5xl sm:mt-16">
        <div className="motion-safe:transition-transform motion-safe:duration-700 hover:motion-safe:scale-[1.01]">
          <WorkoutEditorMock />
        </div>
      </Reveal>
    </MarketingSection>
  );
}
