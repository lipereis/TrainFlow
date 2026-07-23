import {
  applySecurityHeaders,
  CSP_DIRECTIVE_EXTRAS,
  SECURITY_HEADERS,
} from "./security-headers";

describe("security-headers", () => {
  it("exposes the required static security headers", () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "X-Frame-Options",
      ]),
    );
  });

  it("locks framing and objects in CSP extras", () => {
    expect(CSP_DIRECTIVE_EXTRAS["frame-ancestors"]).toEqual(["'none'"]);
    expect(CSP_DIRECTIVE_EXTRAS["object-src"]).toEqual(["'none'"]);
    expect(CSP_DIRECTIVE_EXTRAS["base-uri"]).toEqual(["'self'"]);
  });

  it("allowlists Stripe Checkout / Portal and Clerk protect hosts", () => {
    expect(CSP_DIRECTIVE_EXTRAS["frame-src"]).toEqual(
      expect.arrayContaining([
        "https://*.protect.clerk.com",
        "https://checkout.stripe.com",
        "https://billing.stripe.com",
      ]),
    );
    expect(CSP_DIRECTIVE_EXTRAS["form-action"]).toEqual(
      expect.arrayContaining([
        "'self'",
        "https://checkout.stripe.com",
        "https://billing.stripe.com",
      ]),
    );
    expect(CSP_DIRECTIVE_EXTRAS["connect-src"]).toContain(
      "https://*.protect.clerk.com",
    );
  });

  it("does not add script-src unsafe-inline or unsafe-eval extras", () => {
    const joined = JSON.stringify(CSP_DIRECTIVE_EXTRAS);
    expect(joined).not.toContain("unsafe-inline");
    expect(joined).not.toContain("unsafe-eval");
  });

  it("applies static headers onto a Headers instance", () => {
    const headers = new Headers();
    applySecurityHeaders(headers);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=");
  });
});
