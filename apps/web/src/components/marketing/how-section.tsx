import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";

const STEPS = ["how1", "how2", "how3", "how4", "how5", "how6"] as const;

export async function HowSection() {
  const t = await getTranslations("landing");

  return (
    <section className="border-y border-border/60 bg-muted/30 py-20 sm:py-24">
      <Container>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("howTitle")}
        </h2>

        <ol className="mt-12 space-y-8">
          {STEPS.map((key, index) => (
            <li key={key} className="flex gap-5 sm:gap-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <div className="pt-1">
                <h3 className="text-lg font-medium text-foreground">{t(`${key}Title`)}</h3>
                <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
                  {t(`${key}Body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
