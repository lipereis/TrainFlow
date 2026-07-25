import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** Soft grain + optional grid for dark cinematic bands. */
export function Atmosphere({
  className,
  children,
  grid = true,
}: {
  className?: string;
  children?: ReactNode;
  grid?: boolean;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {grid && (
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      )}
      <div
        className="absolute -left-1/4 top-0 h-[70%] w-[70%] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--mkt-glow) / 0.35), transparent 65%)",
        }}
      />
      <div
        className="absolute -right-1/4 bottom-0 h-[55%] w-[55%] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--mkt-glow) / 0.25), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {children}
    </div>
  );
}

export function BrowserChrome({
  title,
  children,
  className,
  dark = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-card",
        dark
          ? "border-mkt-dark-border bg-mkt-dark-surface text-white"
          : "border-black/8 bg-white text-mkt-light-fg",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-3",
          dark ? "border-mkt-dark-border bg-black/30" : "border-black/5 bg-mkt-light-muted",
        )}
      >
        <span className="size-2.5 rounded-full bg-black/15 dark:bg-white/20" />
        <span className="size-2.5 rounded-full bg-black/15 dark:bg-white/20" />
        <span className="size-2.5 rounded-full bg-black/15 dark:bg-white/20" />
        <span
          className={cn(
            "ml-2 truncate text-xs font-medium",
            dark ? "text-mkt-dark-muted" : "text-mkt-light-muted-fg",
          )}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
