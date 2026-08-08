import { ROLES } from "@trainflow/shared-types";

describe("@trainflow/shared-types import", () => {
  it("resolves the workspace package and exposes ROLES", () => {
    expect(ROLES).toEqual(["TRAINER", "CLIENT"]);
  });
});
