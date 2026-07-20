import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";

describe("RolesGuard", () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  function ctx(role: string): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { clerkUserId: "u1", role } }),
      }),
    } as unknown as ExecutionContext;
  }

  it("allows matching role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["TRAINER"]);
    expect(guard.canActivate(ctx("TRAINER"))).toBe(true);
  });

  it("rejects mismatched role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["TRAINER"]);
    expect(() => guard.canActivate(ctx("CLIENT"))).toThrow(ForbiddenException);
  });
});
