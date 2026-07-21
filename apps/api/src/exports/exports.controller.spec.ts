import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ExportsController } from "./exports.controller";

describe("ExportsController ownership", () => {
  const workouts = {
    get: jest.fn(),
  };
  const trainers = {
    findByClerkUserId: jest.fn(),
    createFromClerk: jest.fn(),
  };
  const prisma = {
    trainer: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
  };
  const excel = { build: jest.fn() };
  const pdf = { build: jest.fn() };

  const controller = new ExportsController(
    workouts as never,
    trainers as never,
    prisma as never,
    excel as never,
    pdf as never,
  );

  const user = { clerkUserId: "clerk_1", role: "TRAINER" as const };

  beforeEach(() => {
    jest.clearAllMocks();
    trainers.findByClerkUserId.mockResolvedValue({ id: "t1" });
  });

  it("propagates FORBIDDEN when workouts.get rejects wrong trainer", async () => {
    workouts.get.mockRejectedValue(
      new ForbiddenException({
        code: "FORBIDDEN_CROSS_TENANT",
        message: "Workout not found for this trainer",
      }),
    );

    await expect(controller.exportXlsx(user as never, "p-other")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(workouts.get).toHaveBeenCalledWith("t1", "p-other");
    expect(excel.build).not.toHaveBeenCalled();
  });

  it("propagates NOT_FOUND when workouts.get rejects missing program", async () => {
    workouts.get.mockRejectedValue(
      new NotFoundException({
        code: "WORKOUT_NOT_FOUND",
        message: "Workout program not found",
      }),
    );

    await expect(controller.exportPdf(user as never, "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(workouts.get).toHaveBeenCalledWith("t1", "missing");
    expect(pdf.build).not.toHaveBeenCalled();
  });
});
