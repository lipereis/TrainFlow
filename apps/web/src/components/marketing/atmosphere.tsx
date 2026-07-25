import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** Subtle depth — uses primary glow so it matches the app accent. */
export function Atmosphere({
  className,
  children,
  grid = false,
}: {
  className?: string;
  children?: ReactNode;
  grid?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {grid && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      )}
      <div className="absolute -left-1/4 top-0 h-[55%] w-[55%] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-1/4 bottom-0 h-[45%] w-[45%] rounded-full bg-primary/5 blur-3xl" />
      {children}
    </div>
  );
}

export function BrowserChrome({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-2 truncate text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
