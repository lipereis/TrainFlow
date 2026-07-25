import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

const sizes = {
  sm: "sm" as const,
  md: "md" as const,
  lg: "lg" as const,
};

/** Maps legacy marketing variants onto shared app button styles. */
const variantMap = {
  accent: "primary",
  accentOnLight: "primary",
  ghostDark: "secondary",
  ghostLight: "secondary",
  linkDark: "ghost",
  linkLight: "ghost",
} as const;

export function marketingCtaClassName(
  variant: keyof typeof variantMap = "accent",
  size: keyof typeof sizes = "md",
  className?: string,
) {
  const mapped = variantMap[variant];
  return buttonClassName(
    mapped,
    sizes[size],
    cn(
      (variant === "linkDark" || variant === "linkLight") &&
        "underline-offset-4 hover:underline",
      className,
    ),
  );
}

export function MarketingCta({
  variant = "accent",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizes;
}) {
  return (
    <Link
      className={marketingCtaClassName(variant, size, className)}
      {...props}
    />
  );
}
