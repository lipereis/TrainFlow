-- CreateEnum
CREATE TYPE "TrainerPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "TrainerPlanStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- AlterTable
ALTER TABLE "Trainer" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "plan" "TrainerPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planStatus" "TrainerPlanStatus" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_stripeCustomerId_key" ON "Trainer"("stripeCustomerId");
