import type { BadgeVariant } from "@/lib/status-badge";

export const badgeVariantClass: Record<BadgeVariant, string> = {
  default: "border-border bg-muted text-muted-foreground",
  success: "border-primary/20 bg-primary/10 text-primary",
  quiet: "border-border bg-muted/60 text-muted-foreground opacity-80",
};
