import { badgeVariantClass } from "./badge-variants";

describe("badgeVariantClass", () => {
  it("applies success classes", () => {
    expect(badgeVariantClass.success).toContain("bg-statusActive/10");
    expect(badgeVariantClass.success).toContain("text-statusActive");
  });

  it("applies quiet classes", () => {
    expect(badgeVariantClass.quiet).toContain("opacity-80");
  });

  it("keeps default muted look", () => {
    expect(badgeVariantClass.default).toContain("bg-muted");
    expect(badgeVariantClass.default).toContain("text-muted-foreground");
  });
});
