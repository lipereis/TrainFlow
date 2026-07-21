import { AuthGuard } from "./auth.guard";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

jest.mock("@clerk/backend", () => ({
  createClerkClient: () => ({
    authenticateRequest: jest.fn(),
  }),
  verifyToken: jest.fn(),
}));

import { verifyToken } from "@clerk/backend";

describe("AuthGuard", () => {
  const guard = new AuthGuard();

  function ctxWithAuth(header?: string): ExecutionContext {
    const request: { headers: Record<string, string | undefined>; user?: unknown } = {
      headers: { authorization: header },
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it("rejects missing bearer token", async () => {
    await expect(guard.canActivate(ctxWithAuth(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("attaches user from verified token (publicMetadata)", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      sub: "user_123",
      publicMetadata: { role: "TRAINER" },
    });
    const ctx = ctxWithAuth("Bearer tok");
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    const req = ctx.switchToHttp().getRequest() as { user: { clerkUserId: string; role: string } };
    expect(req.user).toEqual({ clerkUserId: "user_123", role: "TRAINER" });
  });

  it("attaches user from session token metadata claim", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      sub: "user_456",
      metadata: { role: "CLIENT" },
    });
    const ctx = ctxWithAuth("Bearer tok");
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    const req = ctx.switchToHttp().getRequest() as { user: { clerkUserId: string; role: string } };
    expect(req.user).toEqual({ clerkUserId: "user_456", role: "CLIENT" });
  });

  it("prefers metadata over publicMetadata when both present", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      sub: "user_789",
      metadata: { role: "TRAINER" },
      publicMetadata: { role: "CLIENT" },
    });
    const ctx = ctxWithAuth("Bearer tok");
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    const req = ctx.switchToHttp().getRequest() as { user: { clerkUserId: string; role: string } };
    expect(req.user).toEqual({ clerkUserId: "user_789", role: "TRAINER" });
  });
});
