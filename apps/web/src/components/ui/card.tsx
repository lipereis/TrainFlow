import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

const stripeClass = {
  primary: "bg-primary",
  statusActive: "bg-statusActive",
  statusPending: "bg-statusPending",
} as const;

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Top accent stripe color. Pass "none" to omit it entirely. */
  accent?: keyof typeof stripeClass | "none";
};

export function Card({
  className,
  accent = "primary",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
      {...props}
    >
      {accent !== "none" && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-xl",
            stripeClass[accent],
          )}
        />
      )}
      {children}
    </div>
  );
}
