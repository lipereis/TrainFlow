import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProductMockup } from "@/components/marketing/product-mockup";

export async function Hero() {
  const t = await getTranslations("landing");

  return (
    <section className="border-b border-border/60 py-12 sm:py-24 lg:py-28">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="motion-safe:animate-[fadeIn_0.6s_ease]">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-primary sm:mb-4 sm:text-sm">
              {t("heroEyebrow")}
            </p>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
              {t("heroSubtitle")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/sign-up"
                className={buttonClassName("primary", "lg", "w-full justify-center sm:w-auto")}
              >
                {t("navTrial")}
              </Link>
              <Link
                href="/sign-in"
                className={buttonClassName("secondary", "lg", "w-full justify-center sm:w-auto")}
              >
                {t("navSignIn")}
              </Link>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-8">
              {t("heroTrust")}
            </p>
          </div>

          <div className="min-w-0 motion-safe:animate-[fadeIn_0.8s_ease_0.1s_both] lg:pl-4">
            <ProductMockup />
          </div>
        </div>
      </Container>
    </section>
  );
}
