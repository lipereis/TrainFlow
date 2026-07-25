import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { Reveal } from "@/components/marketing/reveal";

const FAQS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

export async function FaqSection() {
  const t = await getTranslations("landing");

  return (
    <MarketingSection id="faq" tone="light" className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight text-mkt-light-fg sm:text-4xl">
          {t("faqTitle")}
        </h2>

        <div className="mt-10 space-y-3">
          {FAQS.map((key) => (
            <details
              key={key}
              className="group rounded-2xl border border-black/8 bg-mkt-light-muted/50 px-5 py-1 open:bg-white"
            >
              <summary className="cursor-pointer list-none py-4 text-base font-medium text-mkt-light-fg marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {t(`${key}Q`)}
                  <span
                    className="text-mkt-accent transition group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-black/5 pb-4 pt-3 text-sm leading-relaxed text-mkt-light-muted-fg">
                {t(`${key}A`)}
              </p>
            </details>
          ))}
        </div>
      </Reveal>
    </MarketingSection>
  );
}
