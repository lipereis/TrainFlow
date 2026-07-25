import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/ui/container";

export async function MarketingFooter() {
  const t = await getTranslations("landing");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20 py-12 sm:py-16">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <BrandLogo href="/" size="sm" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t("footerTagline")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">
              {t("footerProduct")}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href="#product"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footerProductLink")}
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footerFeatures")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footerPricing")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">
              {t("footerLegal")}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">{t("footerPrivacy")}</span>
              </li>
              <li>
                <span className="text-muted-foreground">{t("footerTerms")}</span>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("navSignIn")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dev/clear-clerk"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footerClearSession")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          {t("footerRights", { year })}
        </p>
      </Container>
    </footer>
  );
}
