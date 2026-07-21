import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AuthGuard } from "../src/common/guards/auth.guard";
import { PrismaService } from "../src/prisma/prisma.service";
import { CLERK_INVITER } from "../src/clients/clients.module";
import { InvitesService } from "../src/invites/invites.service";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { loadDbEnv } from "./helpers/load-db-env";
import { mockAuthGuard } from "./helpers/mock-auth";

loadDbEnv();

describe("Invite flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let invites: InvitesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideProvider(CLERK_INVITER)
      .useValue({ sendInvitation: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    invites = app.get(InvitesService);

    await prisma.inviteToken.deleteMany();
    await prisma.workoutProgram.deleteMany();
    await prisma.client.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.trainer.create({
      data: {
        clerkUserId: "user_trainer_e2e",
        name: "Trainer E2E",
        email: "trainer-e2e@example.com",
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("invites, accepts, lists ACTIVE client", async () => {
    const inviteRes = await request(app.getHttpServer())
      .post("/clients/invite")
      .send({ name: "Client E2E", email: "client-e2e@example.com" })
      .expect(201);

    expect(inviteRes.body.id).toBeTruthy();
    expect(inviteRes.body.status).toBe("PENDING");

    const tokenRow = await prisma.inviteToken.findFirst({
      where: { clientId: inviteRes.body.id },
    });
    expect(tokenRow).toBeTruthy();

    const accepted = await invites.accept({
      token: tokenRow!.token,
      clerkUserId: "user_client_e2e",
      email: "client-e2e@example.com",
      name: "Client E2E",
    });
    expect(accepted.status).toBe("ACTIVE");

    const listRes = await request(app.getHttpServer()).get("/clients").expect(200);
    expect(
      listRes.body.some((c: { email: string }) => c.email === "client-e2e@example.com"),
    ).toBe(true);
  });

  it("returns INVITE_EXPIRED for old token", async () => {
    const trainer = await prisma.trainer.findUniqueOrThrow({
      where: { clerkUserId: "user_trainer_e2e" },
    });
    await prisma.client.create({
      data: {
        trainerId: trainer.id,
        name: "Expired",
        email: "expired@example.com",
        status: "PENDING",
        inviteToken: {
          create: {
            token: "expired-token-e2e",
            expiresAt: new Date(Date.now() - 1000),
          },
        },
      },
    });
    await expect(
      invites.accept({
        token: "expired-token-e2e",
        clerkUserId: "user_x",
        email: "expired@example.com",
        name: "Expired",
      }),
    ).rejects.toMatchObject({ response: { code: "INVITE_EXPIRED" } });
  });
});
