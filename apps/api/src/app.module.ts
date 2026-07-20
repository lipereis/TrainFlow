import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { TrainersModule } from "./trainers/trainers.module";

@Module({
  imports: [PrismaModule, TrainersModule],
})
export class AppModule {}
