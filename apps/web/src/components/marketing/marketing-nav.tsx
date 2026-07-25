"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AppearanceControls } from "@/components/appearance-controls";
import { BrandLogo } from "@/components/brand-logo";
import { marketingCtaClassName } from "@/components/marketing/marketing-cta";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#product", key: "navProduct" as const },
  { href: "#how", key: "navHow" as const },
  { href: "#features", key: "navFeatures" as const },
  { href: "#pricing", key: "navPricing" as const },
];

export function MarketingNav() {
  const t = useTranslations("landing");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "border-b border-white/10 bg-mkt-dark/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-3 sm:h-16">
        <BrandLogo href="/" size="nav" priority className="brightness-0 invert" />

        <nav className="hidden items-center gap-6 lg:flex" aria-label={t("navAria")}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="[&_div]:border-white/20 [&_button]:text-white/70 [&_button:hover]:bg-white/10 [&_button:hover]:text-white [&_.bg-foreground]:bg-white [&_.text-background]:text-mkt-dark">
            <AppearanceControls />
          </div>
          <Link
            href="/sign-in"
            className={marketingCtaClassName("ghostDark", "sm", "hidden sm:inline-flex")}
          >
            {t("navSignIn")}
          </Link>
          <Link
            href="/sign-up"
            className={marketingCtaClassName("accent", "sm", "shrink-0")}
          >
            {t("navGetStarted")}
          </Link>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mkt-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t("navClose") : t("navMenu")}</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className={cn("block h-0.5 w-4 bg-current transition", open && "translate-y-2 rotate-45")} />
              <span className={cn("block h-0.5 w-4 bg-current transition", open && "opacity-0")} />
              <span className={cn("block h-0.5 w-4 bg-current transition", open && "-translate-y-2 -rotate-45")} />
            </span>
          </button>
        </div>
      </Container>

      {open && (
        <div
          id="mkt-mobile-nav"
          className="border-t border-white/10 bg-mkt-dark/95 px-4 py-4 backdrop-blur-md lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label={t("navAria")}>
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
