import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";
import type { BadgeVariant } from "@/lib/status-badge";
import { badgeVariantClass } from "@/components/ui/badge-variants";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
