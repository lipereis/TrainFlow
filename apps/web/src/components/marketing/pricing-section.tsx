import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const PLANS = [
  {
    name: "planStarter",
    price: "planStarterPrice",
    desc: "planStarterDesc",
    cta: "planStarterCta",
    href: "/sign-up",
    featured: false,
    showPeriod: false,
  },
  {
    name: "planPro",
    price: "planProPrice",
    desc: "planProDesc",
    cta: "planProCta",
    href: "/sign-up",
    featured: true,
    showPeriod: true,
  },
] as const;

export async function PricingSection() {
  const t = await getTranslations("landing");

  return (
    <section id="pricing" className="border-y border-border/60 bg-muted/30 py-20 sm:py-24">
      <Container>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("pricingTitle")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("pricingSubtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.featured
                  ? "relative flex flex-col border-primary/30 p-6 shadow-card"
                  : "flex flex-col p-6"
              }
            >
              <h3 className="text-lg font-medium text-foreground">{t(plan.name)}</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {t(plan.price)}
                </span>
                {plan.showPeriod && (
                  <span className="text-sm text-muted-foreground">{t("planPeriod")}</span>
                )}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t(plan.desc)}
              </p>
              <Link
                href={plan.href}
                className={buttonClassName(
                  plan.featured ? "primary" : "secondary",
                  "md",
                  "mt-6 w-full",
                )}
              >
                {t(plan.cta)}
              </Link>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
