export type BadgeVariant = "default" | "success" | "quiet";

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "default";
  if (status === "DRAFT" || status === "ARCHIVED" || status === "INACTIVE") {
    return "quiet";
  }
  return "default";
}
