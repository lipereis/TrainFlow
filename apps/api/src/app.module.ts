import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { TrainersModule } from "./trainers/trainers.module";
import { ClientsModule } from "./clients/clients.module";
import { InvitesModule } from "./invites/invites.module";

@Module({
  imports: [PrismaModule, TrainersModule, ClientsModule, InvitesModule],
})
export class AppModule {}
