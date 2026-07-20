import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import { ROLES, type Role } from "@trainflow/shared-types";
import type { AuthUser } from "../types/auth-user";

type VerifiedPayload = {
  sub?: string;
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
      // @clerk/backend verifyToken accepts secretKey (JWKS remote) or jwtKey (networkless).
      const payload = (await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })) as VerifiedPayload;
      const role = payload.publicMetadata?.role;
      if (!payload.sub || !role || !ROLES.includes(role as Role)) {
        throw new UnauthorizedException({
          code: "UNAUTHORIZED",
          message: "Missing or invalid role in token",
        });
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
