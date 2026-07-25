"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AppearanceControls } from "@/components/appearance-controls";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClassName } from "@/components/ui/button";
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
    const onScroll = () => setScrolled(window.scrollY > 12);
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
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200",
        scrolled || open
          ? "border-border/60 bg-background/90 shadow-sm backdrop-blur-md"
          : "border-border/40 bg-background/80 backdrop-blur-md",
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-3 sm:h-16">
        <span className="sm:hidden">
          <BrandLogo href="/" size="xs" priority />
        </span>
        <span className="hidden sm:inline-flex">
          <BrandLogo href="/" size="nav" priority />
        </span>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label={t("navAria")}
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
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
            {t("navGetStarted")}
          </Link>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
            aria-expanded={open}
            aria-controls="mkt-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t("navClose") : t("navMenu")}</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span
                className={cn(
                  "block h-0.5 w-4 bg-current transition",
                  open && "translate-y-2 rotate-45",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-4 bg-current transition",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-4 bg-current transition",
                  open && "-translate-y-2 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </Container>

      {open && (
        <div
          id="mkt-mobile-nav"
          className="border-t border-border/60 bg-background px-4 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label={t("navAria")}>
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
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
