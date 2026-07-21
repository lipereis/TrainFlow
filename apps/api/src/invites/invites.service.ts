import {
  GoneException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import type { AcceptInviteInput, ClientDto } from "@trainflow/shared-types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async accept(input: AcceptInviteInput): Promise<ClientDto> {
    const row = await this.prisma.inviteToken.findUnique({
      where: { token: input.token },
      include: { client: true },
    });
    if (!row) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        message: "Invite not found",
      });
    }

    const now = new Date();
    if (row.expiresAt.getTime() < now.getTime()) {
      throw new GoneException({
        code: "INVITE_EXPIRED",
        message: "Invite expired",
      });
    }
    if (row.usedAt) {
      throw new ConflictException({
        code: "INVITE_ALREADY_USED",
        message: "Invite already used",
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.inviteToken.updateMany({
        where: {
          token: input.token,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimed.count === 0) {
        const current = await tx.inviteToken.findUnique({
          where: { token: input.token },
        });
        if (current?.usedAt) {
          throw new ConflictException({
            code: "INVITE_ALREADY_USED",
            message: "Invite already used",
          });
        }
        throw new GoneException({
          code: "INVITE_EXPIRED",
          message: "Invite expired",
        });
      }

      return tx.client.update({
        where: { id: row.clientId },
        data: {
          clerkUserId: input.clerkUserId,
          status: "ACTIVE",
          name: input.name || row.client.name,
          email: input.email || row.client.email,
        },
      });
    });

    return this.toDto(updated);
  }
}
