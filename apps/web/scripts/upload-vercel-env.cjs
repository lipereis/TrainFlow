const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

function parseEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    let v = t.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1).replace(/\\"/g, '"');
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

function scrub(text, secrets) {
  let out = String(text || "");
  for (const s of secrets) {
    if (s && out.includes(s)) out = out.split(s).join("[REDACTED]");
  }
  return out.replace(/(sk_|pk_|whsec_|postgresql:\/\/)[^\s"']+/gi, "$1***");
}

const cwd = path.join(__dirname, "..");
const envFile = path.join(cwd, ".env.vercel");
if (!fs.existsSync(envFile)) {
  console.error("MISSING_ENV_FILE");
  process.exit(1);
}

const env = parseEnv(envFile);
const required = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "DATABASE_URL",
  "DIRECT_URL",
];
const missing = required.filter((k) => !env[k]);
if (missing.length) {
  console.error(JSON.stringify({ missing }));
  process.exit(1);
}

const dbOk =
  /:6543/.test(env.DATABASE_URL) && /pgbouncer=true/.test(env.DATABASE_URL);
const directOk =
  /:5432/.test(env.DIRECT_URL) && !/pgbouncer=true/.test(env.DIRECT_URL);
if (!dbOk || !directOk) {
  console.error(JSON.stringify({ dbOk, directOk }));
  process.exit(1);
}

const sensitiveKeys = new Set([
  "CLERK_SECRET_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
]);
const secrets = required.map((k) => env[k]);
// Sensitive vars: Production + Preview only (Vercel restriction).
const plan = [];
for (const key of required) {
  const targets = sensitiveKeys.has(key)
    ? ["production", "preview"]
    : ["production", "preview", "development"];
  for (const target of targets) {
    plan.push({ key, target, sensitive: sensitiveKeys.has(key) });
  }
}

const results = [];
for (const { key, target, sensitive } of plan) {
  const args = [
    "dlx",
    "vercel",
    "env",
    "add",
    key,
    target,
    "--value",
    env[key],
    "--yes",
    "--force",
    sensitive ? "--sensitive" : "--no-sensitive",
  ];

  const r = spawnSync("pnpm", args, {
    cwd,
    encoding: "utf8",
    shell: true,
  });
  const out = scrub((r.stdout || "") + (r.stderr || ""), secrets);
  const ok = r.status === 0;
  results.push({
    key,
    target,
    ok,
    status: r.status,
    snippet: out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(-2)
      .join(" | "),
  });
  if (!ok) {
    console.log(JSON.stringify({ results, failed: { key, target } }, null, 2));
    process.exit(1);
  }
}

console.log(
  JSON.stringify(
    {
      uploaded: results.map((r) => ({ key: r.key, target: r.target, ok: r.ok })),
      okCount: results.filter((r) => r.ok).length,
      dbOk,
      directOk,
    },
    null,
    2,
  ),
);
