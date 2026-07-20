import type { Role } from "@trainflow/shared-types";

export function roleFromClaims(claims: Record<string, unknown> | null | undefined): Role | null {
  const meta =
    (claims?.metadata as { role?: string } | undefined) ??
    (claims?.publicMetadata as { role?: string } | undefined);
  const role = meta?.role;
  if (role === "TRAINER" || role === "CLIENT") return role;
  return null;
}
