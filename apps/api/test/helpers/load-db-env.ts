import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/** Prefer packages/db/.env (Prisma Dev) over a stale root .env. */
export function loadDbEnv(): void {
  const candidates = [
    resolve(__dirname, "../../../../packages/db/.env"),
    resolve(process.cwd(), "../../packages/db/.env"),
    resolve(process.cwd(), "packages/db/.env"),
  ];
  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const line = readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("DATABASE_URL="));
    if (!line) continue;
    process.env.DATABASE_URL = line
      .slice("DATABASE_URL=".length)
      .trim()
      .replace(/^["']|["']$/g, "");
    return;
  }
}
