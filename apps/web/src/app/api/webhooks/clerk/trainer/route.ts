import { Webhook } from "svix";
import { NextRequest } from "next/server";
import { jsonOk, withHandler } from "@/server/http";
import { badRequest, misconfigured, unauthorized } from "@/server/errors";
import { trainersService } from "@/server/trainers.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw misconfigured(
        "WEBHOOK_SECRET_MISSING",
        "CLERK_WEBHOOK_SECRET is not configured on this deployment",
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
        public_metadata?: { role?: string };
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

    const role = event.data.public_metadata?.role ?? "TRAINER";
    if (role !== "TRAINER") {
      return jsonOk({ ok: true, ignored: true });
    }

    const email = event.data.email_addresses?.[0]?.email_address;
    if (!email) {
      throw badRequest("VALIDATION_ERROR", "Trainer email missing");
    }
    const name =
      [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
      email;

    await trainersService.createFromClerk({
      clerkUserId: event.data.id,
      name,
      email,
    });
    return jsonOk({ ok: true });
  });
}
