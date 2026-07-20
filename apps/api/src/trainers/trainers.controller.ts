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
import { TrainersService } from "./trainers.service";

type ClerkUserCreated = {
  type: string;
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: { email_address: string }[];
    public_metadata?: { role?: string };
  };
};

@Controller("trainers")
export class TrainersController {
  constructor(private readonly trainers: TrainersService) {}

  @Post("signup-webhook")
  async signupWebhook(
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
    let event: ClerkUserCreated;
    try {
      event = wh.verify(req.rawBody?.toString("utf8") ?? JSON.stringify(req.body), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkUserCreated;
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid webhook signature",
      });
    }

    if (event.type !== "user.created") {
      return { ok: true, ignored: true };
    }

    const role = event.data.public_metadata?.role ?? "TRAINER";
    if (role !== "TRAINER") {
      return { ok: true, ignored: true };
    }

    const email = event.data.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Trainer email missing",
      });
    }
    const name =
      [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
      email;

    await this.trainers.createFromClerk({
      clerkUserId: event.data.id,
      name,
      email,
    });
    return { ok: true };
  }
}
