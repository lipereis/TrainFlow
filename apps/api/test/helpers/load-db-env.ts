import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function readEnvValue(fileContents: string, key: string): string | undefined {
  const line = fileContents
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  if (!line) return undefined;
  return line
    .slice(`${key}=`.length)
    .trim()
    .replace(/^["']|["']$/g, "");
}

/** Prefer packages/db/.env (Prisma Dev) over a stale root .env. */
export function loadDbEnv(): void {
  const candidates = [
    resolve(__dirname, "../../../../packages/db/.env"),
    resolve(process.cwd(), "../../packages/db/.env"),
    resolve(process.cwd(), "packages/db/.env"),
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), ".env"),
  ];
  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const contents = readFileSync(envPath, "utf8");
    const databaseUrl = readEnvValue(contents, "DATABASE_URL");
    if (!databaseUrl) continue;
    process.env.DATABASE_URL = databaseUrl;
    const directUrl = readEnvValue(contents, "DIRECT_URL");
    process.env.DIRECT_URL = directUrl || databaseUrl;
    return;
  }

  if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
}
