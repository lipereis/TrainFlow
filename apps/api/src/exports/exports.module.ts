import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TrainersModule } from "../trainers/trainers.module";
import { WorkoutsModule } from "../workouts/workouts.module";
import { ExcelService } from "./excel.service";
import { PdfService } from "./pdf.service";
import { ExportsController } from "./exports.controller";

@Module({
  imports: [PrismaModule, TrainersModule, WorkoutsModule],
  controllers: [ExportsController],
  providers: [ExcelService, PdfService],
})
export class ExportsModule {}
