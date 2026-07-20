import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Webhook } from "svix";
import { Request } from "express";
import { acceptInviteSchema } from "@trainflow/shared-types";
import { InvitesService } from "./invites.service";

@Controller("invites")
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post("accept")
  async acceptWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException({
        code: "INTERNAL_ERROR",
        message: "Webhook secret not configured",
      });
    }
    const wh = new Webhook(secret);
    let event: {
      type: string;
      data: {
        id: string;
        first_name?: string | null;
        last_name?: string | null;
        email_addresses?: { email_address: string }[];
        public_metadata?: { role?: string; inviteToken?: string };
      };
    };
    try {
      event = wh.verify(req.rawBody?.toString("utf8") ?? JSON.stringify(req.body), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid webhook signature",
      });
    }

    if (event.type !== "user.created") {
      return { ok: true, ignored: true };
    }
    if (event.data.public_metadata?.role !== "CLIENT") {
      return { ok: true, ignored: true };
    }
    const token = event.data.public_metadata.inviteToken;
    const email = event.data.email_addresses?.[0]?.email_address;
    if (!token || !email) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Missing invite token or email",
      });
    }
    const name =
      [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
      email;

    const parsed = acceptInviteSchema.safeParse({
      token,
      clerkUserId: event.data.id,
      email,
      name,
    });
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid invite payload",
      });
    }

    await this.invites.accept(parsed.data);
    return { ok: true };
  }
}
