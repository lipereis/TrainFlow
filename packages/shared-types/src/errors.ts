export const ERROR_CODES = [
  "INVITE_EXPIRED",
  "INVITE_ALREADY_USED",
  "CLIENT_NOT_FOUND",
  "FORBIDDEN_CROSS_TENANT",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ApiErrorBody = {
  code: ErrorCode | string;
  message: string;
};
