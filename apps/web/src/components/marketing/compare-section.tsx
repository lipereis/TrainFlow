import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export async function CompareSection() {
  const t = await getTranslations("landing");

  const leftItems = [t("compareLeft1"), t("compareLeft2"), t("compareLeft3")];
  const rightItems = [t("compareRight1"), t("compareRight2"), t("compareRight3")];

  return (
    <section className="border-y border-border/60 bg-muted/30 py-20 sm:py-24">
      <Container>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("compareTitle")}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-muted-foreground">
              {t("compareLeftTitle")}
            </h3>
            <ul className="mt-5 space-y-3">
              {leftItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-primary/20 p-6">
            <h3 className="text-lg font-medium text-foreground">{t("compareRightTitle")}</h3>
            <ul className="mt-5 space-y-3">
              {rightItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground">
                  <span
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary"
                    aria-hidden
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Container>
    </section>
  );
}
