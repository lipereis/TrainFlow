/**
 * Production security headers and CSP origin inventory for TrainFlow.
 *
 * CSP is applied via Clerk `clerkMiddleware({ contentSecurityPolicy: { strict } })`
 * (per-request nonce + `strict-dynamic`). Static headers below are set from
 * `next.config.mjs` and re-applied on middleware responses.
 *
 * ## Content-Security-Policy — allowed external origins
 *
 * ### Injected by Clerk (`@clerk/nextjs` defaults + FAPI host from publishable key)
 * | Origin | Directives | Why |
 * |--------|------------|-----|
 * | Frontend API host (from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) | connect-src | Clerk Frontend API |
 * | `https://challenges.cloudflare.com` | frame-src | Cloudflare Turnstile / bot challenges |
 * | `https://img.clerk.com`, `https://images.clerkstage.dev` | img-src, connect-src | Avatars / Clerk images |
 * | `https://clerk-telemetry.com`, `https://*.clerk-telemetry.com` | connect-src | Optional Clerk telemetry |
 * | `https://api.stripe.com` | connect-src | Stripe.js API (Clerk default; we do not load Stripe.js ourselves) |
 * | `https://js.stripe.com`, `https://*.js.stripe.com` | script-src, frame-src | Stripe.js (Clerk default) |
 * | `https://hooks.stripe.com` | frame-src | 3DS / payment-method frames (Clerk default) |
 * | `https://maps.googleapis.com` | script-src, connect-src | Clerk default (unused by TrainFlow) |
 * | `'self'` | default / connect / form / frame / img / script / style / worker | App origin |
 * | `blob:` | worker-src | Clerk workers + same-origin blob patterns |
 *
 * ### Added by TrainFlow (`CSP_DIRECTIVE_EXTRAS` below)
 * | Origin | Directives | Why |
 * |--------|------------|-----|
 * | `https://*.protect.clerk.com` | connect-src, frame-src | Abuse / fraud protection (not auto-included on `@clerk/nextjs` 6.39.x) |
 * | `https://checkout.stripe.com` | frame-src, form-action | Hosted Checkout |
 * | `https://billing.stripe.com` | frame-src, form-action | Customer Portal |
 * | `blob:`, `data:` | img-src | Safe image / object-URL patterns |
 * | `'none'` | frame-ancestors, object-src | Clickjacking / plugin lock-down |
 * | `'self'` | base-uri | Restrict `<base href>` |
 *
 * ### Vercel
 * | Origin | Directives | Why |
 * |--------|------------|-----|
 * | `'self'` only | — | No Vercel Analytics / Speed Insights scripts in this app |
 *
 * ### Supabase
 * | Origin | Directives | Why |
 * |--------|------------|-----|
 * | (none in browser CSP) | — | Postgres only via server-side `DATABASE_URL` / Prisma |
 *
 * ### PDF / Excel downloads
 * | Origin | Directives | Why |
 * |--------|------------|-----|
 * | `'self'` | connect-src | `GET /api/workouts/[id]/export.pdf` / `.xlsx` |
 * | `blob:` | (object URL) | `URL.createObjectURL` in `api-download.ts` — not a network fetch |
 *
 * ### Deliberate exceptions
 * | Keyword | Directive | Why |
 * |---------|-----------|-----|
 * | `'unsafe-inline'` | **style-src** | Required by Clerk CSS-in-JS |
 * | `'unsafe-inline'` | script-src (listed by Clerk) | Ignored by browsers when `'strict-dynamic'` + nonce are present |
 * | `'unsafe-eval'` | script-src | **Development only** (Next.js HMR). Omitted in production |
 * | `'strict-dynamic'` + nonce | script-src | Production: no host-based script allowlist reliance |
 */

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  // Defense in depth alongside CSP frame-ancestors 'none'
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

/**
 * Extra CSP directive values merged into Clerk's strict policy.
 * Do not repeat hosts already in Clerk defaults unless we need them for a
 * directive Clerk does not set (e.g. protect.clerk.com on 6.39.x).
 */
export const CSP_DIRECTIVE_EXTRAS: Record<string, string[]> = {
  "connect-src": ["https://*.protect.clerk.com"],
  "frame-src": [
    "https://*.protect.clerk.com",
    "https://checkout.stripe.com",
    "https://billing.stripe.com",
  ],
  "form-action": [
    "'self'",
    "https://checkout.stripe.com",
    "https://billing.stripe.com",
  ],
  "img-src": ["blob:", "data:"],
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
};

export function applySecurityHeaders(headers: Headers): void {
  for (const { key, value } of SECURITY_HEADERS) {
    headers.set(key, value);
  }
}

/**
 * Origins allowed to call `/api/*` cross-origin: the native app ships no
 * origin (not subject to CORS), but Expo web (`expo start --web`, port
 * varies) and Capacitor's WebView run the same JS in a browser context and
 * are blocked without an explicit `Access-Control-Allow-Origin`.
 */
const CORS_ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^capacitor:\/\/localhost$/,
  /^ionic:\/\/localhost$/,
];

export function isAllowedCorsOrigin(origin: string | null): origin is string {
  return origin !== null && CORS_ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
}

/** Auth is Bearer-token based (not cookies), so reflecting the origin carries no CSRF risk. */
export function applyCorsHeaders(origin: string, headers: Headers): void {
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", appendVary(headers.get("Vary"), "Origin"));
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
}

function appendVary(existing: string | null, value: string): string {
  if (!existing) return value;
  return existing.split(",").map((v) => v.trim()).includes(value)
    ? existing
    : `${existing}, ${value}`;
}

const OVERRIDE_HEADERS = "x-middleware-override-headers";
const MIDDLEWARE_REQUEST_PREFIX = "x-middleware-request-";

/**
 * Clerk sets `Content-Security-Policy` + `x-nonce` on the **response**.
 * Next.js `headers()` / Script nonces need them on the **request**.
 * Mirror Clerk’s own `setRequestHeadersOnNextResponse` pattern.
 */
export function forwardCspToRequest(req: {
  headers: Headers;
}, res: { headers: Headers }): void {
  const csp = res.headers.get("Content-Security-Policy");
  const nonce = res.headers.get("x-nonce") ?? res.headers.get("X-Nonce");
  if (!csp && !nonce) return;

  if (!res.headers.get(OVERRIDE_HEADERS)) {
    res.headers.set(OVERRIDE_HEADERS, [...req.headers.keys()].join(","));
    req.headers.forEach((val, key) => {
      res.headers.set(`${MIDDLEWARE_REQUEST_PREFIX}${key}`, val);
    });
  }

  const extras: Record<string, string> = {};
  if (csp) extras["Content-Security-Policy"] = csp;
  if (nonce) extras["x-nonce"] = nonce;

  for (const [key, val] of Object.entries(extras)) {
    res.headers.set(
      OVERRIDE_HEADERS,
      `${res.headers.get(OVERRIDE_HEADERS)},${key}`,
    );
    res.headers.set(`${MIDDLEWARE_REQUEST_PREFIX}${key}`, val);
  }
}
