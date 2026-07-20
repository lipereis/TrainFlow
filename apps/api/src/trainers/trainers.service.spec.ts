import { TrainersService } from "./trainers.service";

describe("TrainersService", () => {
  const prisma = {
    trainer: {
      upsert: jest.fn(),
    },
  };
  const service = new TrainersService(prisma as never);

  it("upserts trainer by clerkUserId", async () => {
    prisma.trainer.upsert.mockResolvedValue({
      id: "t1",
      clerkUserId: "user_t",
      name: "Joe",
      email: "joe@ex.com",
    });
    const result = await service.createFromClerk({
      clerkUserId: "user_t",
      name: "Joe",
      email: "joe@ex.com",
    });
    expect(prisma.trainer.upsert).toHaveBeenCalledWith({
      where: { clerkUserId: "user_t" },
      create: { clerkUserId: "user_t", name: "Joe", email: "joe@ex.com" },
      update: { name: "Joe", email: "joe@ex.com" },
    });
    expect(result.id).toBe("t1");
  });
});
