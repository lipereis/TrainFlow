import { Module } from "@nestjs/common";
import { TrainersModule } from "../trainers/trainers.module";
import { PrismaService } from "../prisma/prisma.service";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { createClerkInviter } from "./clerk-inviter";

export const CLERK_INVITER = "CLERK_INVITER";

@Module({
  imports: [TrainersModule],
  controllers: [ClientsController],
  providers: [
    { provide: CLERK_INVITER, useFactory: () => createClerkInviter() },
    {
      provide: ClientsService,
      useFactory: (
        prisma: PrismaService,
        clerk: ReturnType<typeof createClerkInviter>,
      ) => new ClientsService(prisma, clerk),
      inject: [PrismaService, CLERK_INVITER],
    },
  ],
  exports: [ClientsService, CLERK_INVITER],
})
export class ClientsModule {}
