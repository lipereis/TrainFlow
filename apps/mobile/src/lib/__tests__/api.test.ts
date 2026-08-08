import { buildApiRequest, getApiUrl } from "../api";

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
