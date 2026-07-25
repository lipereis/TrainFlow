import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/ui/container";

export async function MarketingFooter() {
  const t = await getTranslations("landing");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-mkt-dark py-12 text-white sm:py-16">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <BrandLogo href="/" size="sm" className="brightness-0 invert" />
            <p className="mt-4 max-w-xs text-sm text-mkt-dark-muted">
              {t("footerTagline")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">{t("footerProduct")}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#product" className="text-mkt-dark-muted hover:text-white">
                  {t("footerProductLink")}
                </a>
              </li>
              <li>
                <a href="#features" className="text-mkt-dark-muted hover:text-white">
                  {t("footerFeatures")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-mkt-dark-muted hover:text-white">
                  {t("footerPricing")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">{t("footerLegal")}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <span className="text-mkt-dark-muted">{t("footerPrivacy")}</span>
              </li>
              <li>
                <span className="text-mkt-dark-muted">{t("footerTerms")}</span>
              </li>
              <li>
                <Link href="/sign-in" className="text-mkt-dark-muted hover:text-white">
                  {t("navSignIn")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dev/clear-clerk"
                  className="text-mkt-dark-muted hover:text-white"
                >
                  {t("footerClearSession")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-mkt-dark-muted">
          {t("footerRights", { year })}
        </p>
      </Container>
    </footer>
  );
}
