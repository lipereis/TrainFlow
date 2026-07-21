import { createClerkClient } from "@clerk/backend";
import type { ClerkInviter } from "./clients.service";

export function createClerkInviter(): ClerkInviter {
  const client = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });
  return {
    async sendInvitation({ email, redirectUrl, publicMetadata }) {
      await client.invitations.createInvitation({
        emailAddress: email,
        redirectUrl,
        publicMetadata,
      });
    },
  };
}
