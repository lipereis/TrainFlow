import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";

const FAQS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

export async function FaqSection() {
  const t = await getTranslations("landing");

  return (
    <section id="faq" className="py-20 sm:py-24">
      <Container className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("faqTitle")}
        </h2>

        <dl className="mt-12 space-y-8">
          {FAQS.map((key) => (
            <div key={key}>
              <dt className="text-base font-medium text-foreground">{t(`${key}Q`)}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{t(`${key}A`)}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
