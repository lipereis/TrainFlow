import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { TrainersModule } from "./trainers/trainers.module";
import { ClientsModule } from "./clients/clients.module";

@Module({
  imports: [PrismaModule, TrainersModule, ClientsModule],
})
export class AppModule {}
