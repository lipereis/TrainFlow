import { getTranslations } from "next-intl/server";
import {
  ClientsMock,
  ExportDocsMock,
  TemplatesMock,
  WorkoutEditorMock,
} from "@/components/marketing/product-mocks";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/cn";

export async function FeaturesSection() {
  const t = await getTranslations("landing");

  const features = [
    {
      title: t("feat1Title"),
      body: t("feat1Body"),
      detail: t("feat1Detail"),
      tone: "light" as const,
      mock: <ClientsMock />,
    },
    {
      title: t("feat2Title"),
      body: t("feat2Body"),
      detail: t("feat2Detail"),
      tone: "dark" as const,
      mock: <WorkoutEditorMock animate />,
    },
    {
      title: t("feat3Title"),
      body: t("feat3Body"),
      detail: t("feat3Detail"),
      tone: "light" as const,
      mock: <TemplatesMock />,
    },
    {
      title: t("feat4Title"),
      body: t("feat4Body"),
      detail: t("feat4Detail"),
      tone: "lightMuted" as const,
      mock: <ExportDocsMock />,
    },
  ];

  return (
    <div id="features">
      {features.map((f, i) => (
        <MarketingSection key={f.title} tone={f.tone} className="py-20 sm:py-24">
          <div
            className={cn(
              "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
              i % 2 === 1 && "lg:[&>*:first-child]:order-2",
            )}
          >
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {f.title}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                {f.body}
              </p>
              <p className="mt-6 text-sm font-medium text-primary">{f.detail}</p>
            </Reveal>
            <Reveal delayMs={80}>{f.mock}</Reveal>
          </div>
        </MarketingSection>
      ))}
    </div>
  );
}
