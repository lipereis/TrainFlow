import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProductMockup } from "@/components/marketing/product-mockup";

export async function Hero() {
  const t = await getTranslations("landing");

  return (
    <section className="border-b border-border/60 py-16 sm:py-24 lg:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="motion-safe:animate-[fadeIn_0.6s_ease]">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
              {t("heroEyebrow")}
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={buttonClassName("primary", "lg")}>
                {t("navTrial")}
              </Link>
              <Link href="/sign-in" className={buttonClassName("secondary", "lg")}>
                {t("navSignIn")}
              </Link>
            </div>
            <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("heroTrust")}
            </p>
          </div>

          <div className="motion-safe:animate-[fadeIn_0.8s_ease_0.1s_both] lg:pl-4">
            <ProductMockup />
          </div>
        </div>
      </Container>
    </section>
  );
}
