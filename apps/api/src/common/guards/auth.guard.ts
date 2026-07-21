import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { ROLES, type Role } from "@trainflow/shared-types";
import type { AuthUser } from "../types/auth-user";

type VerifiedPayload = {
  sub?: string;
  metadata?: { role?: string };
  publicMetadata?: { role?: string };
};

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Missing bearer token",
      });
    }
    const token = header.slice("Bearer ".length);
    try {
      const payload = (await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })) as VerifiedPayload;

      if (!payload.sub) {
        throw new UnauthorizedException({
          code: "UNAUTHORIZED",
          message: "Invalid token subject",
        });
      }

      let role = payload.metadata?.role ?? payload.publicMetadata?.role;

      // JWT can lag after metadata updates — fall back to Clerk user record
      if (!role || !ROLES.includes(role as Role)) {
        const clerk = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY!,
        });
        const user = await clerk.users.getUser(payload.sub);
        role = (user.publicMetadata as { role?: string } | undefined)?.role;

        if (!role || !ROLES.includes(role as Role)) {
          await clerk.users.updateUserMetadata(payload.sub, {
            publicMetadata: {
              ...(user.publicMetadata as Record<string, unknown>),
              role: "TRAINER",
            },
          });
          role = "TRAINER";
        }
      }

      request.user = { clerkUserId: payload.sub, role: role as Role };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  }
}
