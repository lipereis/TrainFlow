import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import type { InviteClientInput, ClientDto } from "@trainflow/shared-types";
import { PrismaService } from "../prisma/prisma.service";

export type ClerkInviter = {
  sendInvitation(input: {
    email: string;
    redirectUrl: string;
    publicMetadata: { role: "CLIENT"; inviteToken: string };
  }): Promise<void>;
};

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerk: ClerkInviter,
  ) {}

  private toDto(client: {
    id: string;
    trainerId: string;
    clerkUserId: string | null;
    name: string;
    email: string;
    status: "PENDING" | "ACTIVE" | "INACTIVE";
    createdAt: Date;
  }): ClientDto {
    return {
      id: client.id,
      trainerId: client.trainerId,
      clerkUserId: client.clerkUserId,
      name: client.name,
      email: client.email,
      status: client.status,
      createdAt: client.createdAt.toISOString(),
    };
  }

  private newToken() {
    return randomBytes(32).toString("hex");
  }

  async invite(trainerId: string, input: InviteClientInput): Promise<ClientDto> {
    const token = this.newToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const client = await this.prisma.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          trainerId,
          name: input.name,
          email: input.email,
          status: "PENDING",
          inviteToken: {
            create: { token, expiresAt },
          },
        },
      });
      return created;
    });

    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    await this.clerk.sendInvitation({
      email: input.email,
      redirectUrl: `${webOrigin}/sign-up?invite_token=${token}`,
      publicMetadata: { role: "CLIENT", inviteToken: token },
    });

    return this.toDto(client);
  }

  async resendInvite(trainerId: string, clientId: string): Promise<ClientDto> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, trainerId },
      include: { inviteToken: true },
    });
    if (!client) {
      throw new ForbiddenException({
        code: "FORBIDDEN_CROSS_TENANT",
        message: "Client not found for this trainer",
      });
    }

    const token = this.newToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    await this.prisma.inviteToken.upsert({
      where: { clientId: client.id },
      create: { clientId: client.id, token, expiresAt },
      update: { token, expiresAt, usedAt: null },
    });

    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    await this.clerk.sendInvitation({
      email: client.email,
      redirectUrl: `${webOrigin}/sign-up?invite_token=${token}`,
      publicMetadata: { role: "CLIENT", inviteToken: token },
    });

    return this.toDto(client);
  }

  async listForTrainer(trainerId: string): Promise<ClientDto[]> {
    const rows = await this.prisma.client.findMany({
      where: { trainerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getForTrainer(trainerId: string, clientId: string): Promise<ClientDto> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, trainerId },
    });
    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        message: "Client not found",
      });
    }
    return this.toDto(client);
  }
}
