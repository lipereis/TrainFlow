import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonNoContent() {
  return new NextResponse(null, { status: 204 });
}

export function toErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { code: err.code, message: err.message },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: err.errors[0]?.message ?? "Validation failed",
      },
      { status: 400 },
    );
  }
  console.error(err);
  return NextResponse.json(
    { code: "INTERNAL_ERROR", message: "Internal server error" },
    { status: 500 },
  );
}

export async function withHandler(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    return toErrorResponse(err);
  }
}

export function parseOrThrow<T>(
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: ZodError } },
  data: unknown,
): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

function httpsOrigin(hostOrUrl: string): string {
  const trimmed = hostOrUrl.replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Canonical app origin for invite redirects and server-side `/api` fetch.
 * Prefer an explicit `NEXT_PUBLIC_APP_URL` after custom domain is known;
 * otherwise use Vercel-provided hosts so the first deploy needs no guessed URL.
 */
export function appOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return httpsOrigin(explicit);

  // Stable production hostname (custom domain or *.vercel.app) when set by Vercel.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return httpsOrigin(production);

  // Per-deployment host (preview + first production deploys).
  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return httpsOrigin(deployment);

  return "http://localhost:3000";
}
