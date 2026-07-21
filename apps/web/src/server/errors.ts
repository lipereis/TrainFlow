export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFound(code: string, message: string) {
  return new ApiError(404, code, message);
}

export function forbidden(code: string, message: string) {
  return new ApiError(403, code, message);
}

export function unauthorized(code: string, message: string) {
  return new ApiError(401, code, message);
}

export function badRequest(code: string, message: string) {
  return new ApiError(400, code, message);
}

export function conflict(code: string, message: string) {
  return new ApiError(409, code, message);
}

export function gone(code: string, message: string) {
  return new ApiError(410, code, message);
}

/** Runtime misconfiguration (e.g. missing webhook secret). Not a build-time failure. */
export function misconfigured(code: string, message: string) {
  return new ApiError(503, code, message);
}
