import { Webhook } from "svix";
import { NextRequest } from "next/server";
import { acceptInviteSchema } from "@trainflow/shared-types";
import { jsonOk, withHandler, parseOrThrow } from "@/server/http";
import { badRequest, misconfigured, unauthorized } from "@/server/errors";
import { invitesService } from "@/server/invites.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const secret =
      process.env.CLERK_INVITE_WEBHOOK_SECRET ??
      process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw misconfigured(
        "WEBHOOK_SECRET_MISSING",
        "CLERK_INVITE_WEBHOOK_SECRET (or CLERK_WEBHOOK_SECRET) is not configured on this deployment",
      );
    }

    const payload = await req.text();
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw unauthorized("UNAUTHORIZED", "Missing webhook headers");
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
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      throw unauthorized("UNAUTHORIZED", "Invalid webhook signature");
    }

    if (event.type !== "user.created") {
      return jsonOk({ ok: true, ignored: true });
    }
    if (event.data.public_metadata?.role !== "CLIENT") {
      return jsonOk({ ok: true, ignored: true });
    }

    const token = event.data.public_metadata.inviteToken;
    const email = event.data.email_addresses?.[0]?.email_address;
    if (!token || !email) {
      throw badRequest("VALIDATION_ERROR", "Missing invite token or email");
    }
    const name =
      [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
      email;

    const parsed = parseOrThrow(acceptInviteSchema, {
      token,
      clerkUserId: event.data.id,
      email,
      name,
    });

    await invitesService.accept(parsed);
    return jsonOk({ ok: true });
  });
}
