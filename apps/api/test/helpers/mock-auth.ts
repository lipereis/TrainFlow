import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "../../src/common/types/auth-user";

export const e2eTrainerUser: AuthUser = {
  clerkUserId: "user_trainer_e2e",
  role: "TRAINER",
};

/** AuthGuard override for e2e — skips Clerk, injects trainer user. */
export const mockAuthGuard: CanActivate = {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    req.user = e2eTrainerUser;
    return true;
  },
};
