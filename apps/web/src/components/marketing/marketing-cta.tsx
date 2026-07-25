import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

const base =
  "inline-flex items-center justify-center rounded-xl font-medium transition-[opacity,transform,background-color,color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

const variants = {
  accent:
    "bg-mkt-accent text-mkt-accent-fg shadow-sm hover:opacity-90 focus-visible:ring-offset-mkt-dark",
  accentOnLight:
    "bg-mkt-accent text-mkt-accent-fg shadow-sm hover:opacity-90 focus-visible:ring-offset-mkt-light",
  ghostDark:
    "border border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-offset-mkt-dark",
  ghostLight:
    "border border-mkt-light-fg/15 bg-white text-mkt-light-fg hover:bg-mkt-light-muted focus-visible:ring-offset-mkt-light",
  linkDark: "text-white/80 underline-offset-4 hover:text-white hover:underline",
  linkLight:
    "text-mkt-light-muted-fg underline-offset-4 hover:text-mkt-light-fg hover:underline",
} as const;

export function marketingCtaClassName(
  variant: keyof typeof variants = "accent",
  size: keyof typeof sizes = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

export function MarketingCta({
  variant = "accent",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <Link
      className={marketingCtaClassName(variant, size, className)}
      {...props}
    />
  );
}
