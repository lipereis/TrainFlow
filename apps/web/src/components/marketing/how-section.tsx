import { getTranslations } from "next-intl/server";
import {
  ClientsMock,
  ExportDocsMock,
  WorkoutEditorMock,
} from "@/components/marketing/product-mocks";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";

export async function HowSection() {
  const t = await getTranslations("landing");

  const steps = [
    {
      num: "01",
      title: t("how1Title"),
      body: t("how1Body"),
      mock: <ClientsMock />,
    },
    {
      num: "02",
      title: t("how2Title"),
      body: t("how2Body"),
      mock: <WorkoutEditorMock />,
    },
    {
      num: "03",
      title: t("how3Title"),
      body: t("how3Body"),
      mock: <ExportDocsMock className="sm:grid-cols-1" />,
    },
  ] as const;

  return (
    <MarketingSection id="how" tone="lightMuted" className="py-20 sm:py-28">
      <Reveal className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("howTitle")}
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("howSubtitle")}
        </p>
      </Reveal>

      <ol className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
        {steps.map((step, i) => (
          <li
            key={step.num}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
          >
            <Reveal
              className={i % 2 === 1 ? "lg:order-2" : undefined}
              delayMs={40}
            >
              <p className="text-5xl font-semibold tabular-nums tracking-tight text-primary/80 sm:text-6xl">
                {step.num}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </Reveal>
            <Reveal
              className={i % 2 === 1 ? "lg:order-1" : undefined}
              delayMs={100}
            >
              {step.mock}
            </Reveal>
          </li>
        ))}
      </ol>
    </MarketingSection>
  );
}
