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
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandLogo href="/" size="xs" priority />

        <div className="flex items-center gap-1.5 sm:gap-3">
          <AppearanceControls />
          <Link href="/sign-in" className={buttonClassName("ghost", "sm")}>
            {t("navSignIn")}
          </Link>
          <Link href="/sign-up" className={buttonClassName("primary", "sm")}>
            {t("navTrial")}
          </Link>
        </div>
      </Container>
    </header>
  );
}
