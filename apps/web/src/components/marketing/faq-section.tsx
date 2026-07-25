import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";

const FAQS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

export async function FaqSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection id="faq" tone="light" className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("faqTitle")}
        </h2>

        <div className="mt-10 space-y-3">
          {FAQS.map((key) => (
            <details
              key={key}
              className="group rounded-2xl border border-border bg-muted/40 px-5 py-1 open:bg-card"
            >
              <summary className="cursor-pointer list-none py-4 text-base font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {t(`${key}Q`)}
                  <span
                    className="text-primary transition group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-border pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`${key}A`)}
              </p>
            </details>
          ))}
        </div>
      </Reveal>
    </MarketingSection>
  );
}
