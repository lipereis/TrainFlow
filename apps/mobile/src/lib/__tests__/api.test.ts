import { apiFetch, buildApiRequest, getApiUrl } from "../api";

declare const global: any;

describe("getApiUrl", () => {
  it("defaults to the production API URL", () => {
    expect(getApiUrl()).toBe("https://trainflow-chi.vercel.app");
  });
});

describe("buildApiRequest", () => {
  it("joins the path onto the API URL", () => {
    const { url } = buildApiRequest("/api/workouts", null);
    expect(url).toBe("https://trainflow-chi.vercel.app/api/workouts");
  });

  it("omits Authorization when there is no token", () => {
    const { init } = buildApiRequest("/api/workouts", null);
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("attaches a Bearer token when present", () => {
    const { init } = buildApiRequest("/api/workouts", "tok_123");
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer tok_123");
  });
});

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns undefined for a 204 No Content response instead of throwing on an empty body", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    ) as unknown as typeof fetch;

    const result = await apiFetch<undefined>("/api/workouts/abc", null, {
      method: "DELETE",
    });

    expect(result).toBeUndefined();
  });

  it("still parses a JSON body for a normal 200 response", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const result = await apiFetch<{ id: string }>("/api/workouts", null);

    expect(result).toEqual({ id: "abc" });
  });
});
