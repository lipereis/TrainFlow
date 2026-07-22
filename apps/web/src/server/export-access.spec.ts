import { ApiError } from "./errors";
import { trainerIdForClientExport } from "./export-access";

const base = {
  id: "p1",
  trainerId: "t1",
  clientId: "c1",
  status: "ACTIVE" as const,
};

describe("trainerIdForClientExport", () => {
  it("returns trainerId for matching ACTIVE program", () => {
    expect(trainerIdForClientExport(base, "c1")).toBe("t1");
  });

  it("404 when program missing", () => {
    try {
      trainerIdForClientExport(null, "c1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
      expect((e as ApiError).code).toBe("WORKOUT_NOT_FOUND");
    }
  });

  it("403 when client does not own program", () => {
    try {
      trainerIdForClientExport(base, "other");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).code).toBe("FORBIDDEN");
    }
  });

  it("403 when program is DRAFT", () => {
    try {
      trainerIdForClientExport({ ...base, status: "DRAFT" }, "c1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).code).toBe("FORBIDDEN");
    }
  });

  it("403 when program is ARCHIVED", () => {
    try {
      trainerIdForClientExport({ ...base, status: "ARCHIVED" }, "c1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
    }
  });
});
