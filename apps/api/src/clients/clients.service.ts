import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import type {
  InviteClientInput,
  CreateClientInput,
  UpdateClientInput,
  ClientDto,
} from "@trainflow/shared-types";
import type { Prisma } from "@trainflow/db";
import { PrismaService } from "../prisma/prisma.service";

export type ClerkInviter = {
  sendInvitation(input: {
    email: string;
    redirectUrl: string;
    publicMetadata: { role: "CLIENT"; inviteToken: string };
  }): Promise<void>;
};

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ClientRow = {
  id: string;
  trainerId: string;
  clerkUserId: string | null;
  name: string;
  email: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  phone: string | null;
  birthDate: Date | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  weeklyAvailability: string | null;
  injuries: string | null;
  restrictions: string | null;
  equipment: string | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerk: ClerkInviter,
  ) {}

  private toDto(client: ClientRow): ClientDto {
    return {
      id: client.id,
      trainerId: client.trainerId,
      clerkUserId: client.clerkUserId,
      name: client.name,
      email: client.email,
      status: client.status,
      phone: client.phone,
      birthDate: client.birthDate?.toISOString() ?? null,
      heightCm: client.heightCm,
      weightKg: client.weightKg,
      goal: client.goal,
      experienceLevel: client.experienceLevel,
      weeklyAvailability: client.weeklyAvailability,
      injuries: client.injuries,
      restrictions: client.restrictions,
      equipment: client.equipment,
      observations: client.observations,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  private newToken() {
    return randomBytes(32).toString("hex");
  }

  private parseBirthDate(
    value: string | null | undefined,
  ): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return new Date(value);
  }

  private profileData(input: CreateClientInput | UpdateClientInput) {
    return {
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.birthDate !== undefined
        ? { birthDate: this.parseBirthDate(input.birthDate) }
        : {}),
      ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
      ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
      ...(input.goal !== undefined ? { goal: input.goal } : {}),
      ...(input.experienceLevel !== undefined
        ? { experienceLevel: input.experienceLevel }
        : {}),
      ...(input.weeklyAvailability !== undefined
        ? { weeklyAvailability: input.weeklyAvailability }
        : {}),
      ...(input.injuries !== undefined ? { injuries: input.injuries } : {}),
      ...(input.restrictions !== undefined
        ? { restrictions: input.restrictions }
        : {}),
      ...(input.equipment !== undefined ? { equipment: input.equipment } : {}),
      ...(input.observations !== undefined
        ? { observations: input.observations }
        : {}),
    };
  }

  private async requireOwnedClient(
    trainerId: string,
    clientId: string,
  ): Promise<ClientRow> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        message: "Client not found",
      });
    }
    if (client.trainerId !== trainerId) {
      throw new ForbiddenException({
        code: "FORBIDDEN_CROSS_TENANT",
        message: "Client not found for this trainer",
      });
    }
    return client as ClientRow;
  }

  async invite(trainerId: string, input: InviteClientInput): Promise<ClientDto> {
    const token = this.newToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const client = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
    try {
      await this.clerk.sendInvitation({
        email: input.email,
        redirectUrl: `${webOrigin}/sign-up?invite_token=${token}`,
        publicMetadata: { role: "CLIENT", inviteToken: token },
      });
    } catch (err) {
      await this.prisma.client.delete({ where: { id: client.id } });
      throw err;
    }

    return this.toDto(client as ClientRow);
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

    return this.toDto(client as ClientRow);
  }

  async create(trainerId: string, input: CreateClientInput): Promise<ClientDto> {
    const client = await this.prisma.client.create({
      data: {
        trainerId,
        name: input.name,
        email: input.email,
        status: input.status ?? "ACTIVE",
        ...this.profileData(input),
      },
    });
    return this.toDto(client as ClientRow);
  }

  async update(
    trainerId: string,
    clientId: string,
    input: UpdateClientInput,
  ): Promise<ClientDto> {
    await this.requireOwnedClient(trainerId, clientId);
    const client = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...this.profileData(input),
      },
    });
    return this.toDto(client as ClientRow);
  }

  async remove(trainerId: string, clientId: string): Promise<void> {
    await this.requireOwnedClient(trainerId, clientId);
    await this.prisma.client.delete({ where: { id: clientId } });
  }

  async list(trainerId: string, q?: string): Promise<ClientDto[]> {
    const trimmed = q?.trim();
    const rows = await this.prisma.client.findMany({
      where: {
        trainerId,
        ...(trimmed
          ? {
              OR: [
                { name: { contains: trimmed, mode: "insensitive" } },
                { email: { contains: trimmed, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: ClientRow) => this.toDto(r));
  }

  async get(trainerId: string, clientId: string): Promise<ClientDto> {
    const client = await this.requireOwnedClient(trainerId, clientId);
    return this.toDto(client);
  }
}
