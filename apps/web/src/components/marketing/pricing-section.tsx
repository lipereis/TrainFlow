import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClassName } from "@/components/ui/button";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/cn";

const PLANS = [
  {
    name: "planStarter",
    price: "planStarterPrice",
    desc: "planStarterDesc",
    cta: "planStarterCta",
    featured: false,
    showPeriod: false,
  },
  {
    name: "planPro",
    price: "planProPrice",
    desc: "planProDesc",
    cta: "planProCta",
    featured: true,
    showPeriod: true,
  },
] as const;

export async function PricingSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection id="pricing" tone="lightMuted" className="py-20 sm:py-24">
      <Reveal className="max-w-2xl">
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl">
          {t("pricingTitle")}
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("pricingSubtitle")}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.name} delayMs={i * 70}>
            <div
              className={cn(
                "flex h-full flex-col rounded-3xl border p-6 sm:p-8",
                plan.featured
                  ? "border-primary/30 bg-card shadow-card"
                  : "border-border bg-card/70",
              )}
            >
              <h3 className="text-lg font-medium text-foreground">
                {t(plan.name)}
              </h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span
                  className={cn(
                    "font-mono text-3xl font-semibold tabular-nums",
                    plan.featured ? "text-primary" : "text-foreground",
                  )}
                >
                  {t(plan.price)}
                </span>
                {plan.showPeriod && (
                  <span className="text-sm text-muted-foreground">
                    {t("planPeriod")}
                  </span>
                )}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t(plan.desc)}
              </p>
              <Link
                href="/sign-up"
                className={buttonClassName(
                  plan.featured ? "primary" : "secondary",
                  "md",
                  "mt-6 w-full",
                )}
              >
                {t(plan.cta)}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </MarketingSection>
  );
}
