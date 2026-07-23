"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { UserButton } from "@clerk/nextjs";
import { AppearanceControls } from "@/components/appearance-controls";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/clients", labelKey: "clients" },
  { href: "/workouts/new", labelKey: "workouts" },
  { href: "/templates", labelKey: "templates" },
  { href: "/exercises", labelKey: "exercises" },
  { href: "/settings/billing", labelKey: "billing" },
] as const;

const DRAWER_ID = "trainer-nav-drawer";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/clients") {
    return pathname === "/clients" || pathname.startsWith("/clients/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-xl px-3 py-2 transition-colors ${
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

const SidebarPanel = forwardRef<
  HTMLElement,
  {
    id?: string;
    onNavigate?: () => void;
    className?: string;
    labelledBy?: string;
  }
>(function SidebarPanel(
  { id, onNavigate, className = "", labelledBy },
  ref,
) {
  return (
    <aside
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      className={`flex w-56 shrink-0 flex-col border-r border-border bg-card text-card-foreground ${className}`}
    >
      <div className="border-b border-border px-3 py-4">
        <BrandLogo href="/dashboard" size="nav" />
      </div>
      <NavLinks onNavigate={onNavigate} />
    </aside>
  );
});

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
  );
  return Array.from(nodes).filter((el) => el.tabIndex !== -1);
}

/** Trainer chrome: fixed sidebar on md+, overlay drawer below md. */
export function TrainerShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        menuButtonRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const focusable = drawer ? getFocusable(drawer) : [];
    focusable[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const items = getFocusable(drawer);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarPanel className="hidden md:flex" />

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 bg-black/40"
            aria-label={t("closeMenu")}
            onClick={close}
          />
          <SidebarPanel
            ref={drawerRef}
            id={DRAWER_ID}
            onNavigate={close}
            labelledBy={`${DRAWER_ID}-label`}
            className="relative z-10 flex h-full max-w-[85vw] shadow-xl"
          />
          <span id={`${DRAWER_ID}-label`} className="sr-only">
            {t("brand")}
          </span>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6 md:h-auto md:py-3">
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-border p-2 text-foreground hover:bg-muted md:hidden"
            aria-expanded={open}
            aria-controls={DRAWER_ID}
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <AppearanceControls />
            <UserButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[90rem] flex-1 bg-background px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
