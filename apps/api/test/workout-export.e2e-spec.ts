import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AuthGuard } from "../src/common/guards/auth.guard";
import { PrismaService } from "../src/prisma/prisma.service";
import { CLERK_INVITER } from "../src/clients/clients.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { loadDbEnv } from "./helpers/load-db-env";
import { mockAuthGuard } from "./helpers/mock-auth";

loadDbEnv();

describe("Workout create → generate → Excel/PDF export (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

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

    await prisma.workoutProgram.deleteMany();
    await prisma.inviteToken.deleteMany();
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

  it("creates client, multi-day program, activates, and exports xlsx + pdf", async () => {
    const clientRes = await request(app.getHttpServer())
      .post("/clients")
      .send({
        name: "Export Client",
        email: "export-client@example.com",
        status: "ACTIVE",
        goal: "Hypertrophy",
        observations: "Stop if pain.",
        experienceLevel: "INTERMEDIATE",
        heightCm: 178,
        weightKg: 82,
      })
      .expect(201);

    const clientId = clientRes.body.id as string;
    expect(clientId).toBeTruthy();

    const createRes = await request(app.getHttpServer())
      .post("/workouts")
      .send({
        clientId,
        name: "Push / Pull Export Program",
        goal: "Build muscle",
        startDate: "2026-07-01",
        endDate: "2026-09-01",
        daysPerWeek: 2,
        level: "INTERMEDIATE",
        location: "Gym",
        equipment: "Barbell, dumbbells",
        observations: "Progressive overload weekly.",
        status: "DRAFT",
        days: [
          {
            name: "Day A — Push",
            focus: "Chest / Shoulders",
            warmup: "5 min bike",
            cooldown: "Stretch",
            observations: "Control eccentrics",
            sortOrder: 0,
            exercises: [
              {
                customName: "Barbell Bench Press",
                muscleGroup: "Chest",
                category: "Compound",
                sets: 4,
                repsMin: 6,
                repsMax: 8,
                weight: 80,
                weightUnit: "KG",
                restSec: 120,
                tempo: "3010",
                rpe: 8,
                method: "Standard sets",
                observation: "Pause on chest",
                sortOrder: 0,
              },
              {
                customName: "Overhead Press",
                muscleGroup: "Shoulders",
                category: "Compound",
                sets: 3,
                repsMin: 8,
                repsMax: 10,
                weight: 40,
                weightUnit: "KG",
                restSec: 90,
                method: "Standard sets",
                sortOrder: 1,
              },
            ],
          },
          {
            name: "Day B — Pull",
            focus: "Back",
            sortOrder: 1,
            exercises: [
              {
                customName: "Barbell Row",
                muscleGroup: "Back",
                category: "Compound",
                sets: 4,
                repsMin: 8,
                repsMax: 10,
                weight: 70,
                weightUnit: "KG",
                restSec: 90,
                method: "Standard sets",
                sortOrder: 0,
              },
            ],
          },
        ],
      })
      .expect(201);

    const workoutId = createRes.body.id as string;
    expect(workoutId).toBeTruthy();
    expect(createRes.body.status).toBe("DRAFT");
    expect(createRes.body.days).toHaveLength(2);
    expect(createRes.body.days[0].exercises.length).toBeGreaterThanOrEqual(2);
    expect(createRes.body.days[1].exercises.length).toBeGreaterThanOrEqual(1);

    const activateRes = await request(app.getHttpServer())
      .patch(`/workouts/${workoutId}`)
      .send({ status: "ACTIVE" })
      .expect(200);

    expect(activateRes.body.status).toBe("ACTIVE");

    const xlsxRes = await request(app.getHttpServer())
      .get(`/workouts/${workoutId}/export.xlsx`)
      .buffer(true)
      .parse((res, callback) => {
        const data: Buffer[] = [];
        res.on("data", (chunk: Buffer) => data.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(data)));
      })
      .expect(200);

    expect(xlsxRes.headers["content-type"]).toMatch(/spreadsheetml|octet-stream/i);
    const xlsxBuf = xlsxRes.body as Buffer;
    expect(Buffer.isBuffer(xlsxBuf)).toBe(true);
    expect(xlsxBuf.length).toBeGreaterThan(1000);
    // XLSX is a ZIP archive
    expect(xlsxBuf.subarray(0, 2).toString("binary")).toBe("PK");

    const pdfRes = await request(app.getHttpServer())
      .get(`/workouts/${workoutId}/export.pdf`)
      .buffer(true)
      .parse((res, callback) => {
        const data: Buffer[] = [];
        res.on("data", (chunk: Buffer) => data.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(data)));
      })
      .expect(200);

    expect(pdfRes.headers["content-type"]).toMatch(/pdf/i);
    const pdfBuf = pdfRes.body as Buffer;
    expect(Buffer.isBuffer(pdfBuf)).toBe(true);
    expect(pdfBuf.length).toBeGreaterThan(500);
    expect(pdfBuf.subarray(0, 4).toString("binary")).toBe("%PDF");

    const getRes = await request(app.getHttpServer())
      .get(`/workouts/${workoutId}`)
      .expect(200);
    expect(getRes.body.name).toBe("Push / Pull Export Program");
    expect(getRes.body.clientId).toBe(clientId);
  });
});
