import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppearanceControls } from "@/components/appearance-controls";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export async function MarketingNav() {
  const t = await getTranslations("landing");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
        <span className="sm:hidden">
          <BrandLogo href="/" size="xs" priority />
        </span>
        <span className="hidden sm:inline-flex">
          <BrandLogo href="/" size="nav" priority />
        </span>

        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <AppearanceControls />
          <Link
            href="/sign-in"
            className={buttonClassName("ghost", "sm", "hidden sm:inline-flex")}
          >
            {t("navSignIn")}
          </Link>
          <Link
            href="/sign-up"
            className={buttonClassName("primary", "sm", "shrink-0")}
          >
            {t("navTrial")}
          </Link>
        </div>
      </Container>
    </header>
  );
}
