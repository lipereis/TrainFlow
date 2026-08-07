import type { BadgeVariant } from "@/lib/status-badge";

export const badgeVariantClass: Record<BadgeVariant, string> = {
  default: "border-border bg-muted text-muted-foreground",
  success: "border-statusActive/30 bg-statusActive/10 text-statusActive",
  quiet: "border-border bg-muted/60 text-muted-foreground opacity-80",
};
