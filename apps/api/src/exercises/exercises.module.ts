import { Module } from "@nestjs/common";
import { TrainersModule } from "../trainers/trainers.module";
import { ExercisesController } from "./exercises.controller";
import { ExercisesService } from "./exercises.service";

@Module({
  imports: [TrainersModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
