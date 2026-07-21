import { Module } from "@nestjs/common";
import { TrainersModule } from "../trainers/trainers.module";
import { TemplatesModule } from "../templates/templates.module";
import { WorkoutsController } from "./workouts.controller";
import { WorkoutsService } from "./workouts.service";

@Module({
  imports: [TrainersModule, TemplatesModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
