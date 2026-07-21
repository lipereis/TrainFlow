import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

/**
 * Nest does not load monorepo env files by itself. Prefer already-set vars
 * (CI / shell), then apps/api/.env, repo root .env, packages/db/.env.
 */
const candidates = [
  resolve(__dirname, "../.env"),
  resolve(__dirname, "../../../.env"),
  resolve(__dirname, "../../../packages/db/.env"),
];

for (const path of candidates) {
  if (!existsSync(path)) continue;
  config({ path, override: false });
}

if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}
