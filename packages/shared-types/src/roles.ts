export const ROLES = ["TRAINER", "CLIENT"] as const;
export type Role = (typeof ROLES)[number];
