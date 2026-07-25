import { statusBadgeVariant } from "./status-badge";

describe("statusBadgeVariant", () => {
  it("maps ACTIVE to success", () => {
    expect(statusBadgeVariant("ACTIVE")).toBe("success");
  });
  it("maps PENDING to default", () => {
    expect(statusBadgeVariant("PENDING")).toBe("default");
  });
  it("maps DRAFT/ARCHIVED/INACTIVE to quiet", () => {
    expect(statusBadgeVariant("DRAFT")).toBe("quiet");
    expect(statusBadgeVariant("ARCHIVED")).toBe("quiet");
    expect(statusBadgeVariant("INACTIVE")).toBe("quiet");
  });
  it("falls back to default", () => {
    expect(statusBadgeVariant("UNKNOWN")).toBe("default");
  });
});
