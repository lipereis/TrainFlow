import assert from "node:assert/strict";
import { inviteClientSchema } from "./clients";

const bad = inviteClientSchema.safeParse({ name: "", email: "not-an-email" });
assert.equal(bad.success, false);

const good = inviteClientSchema.safeParse({
  name: "Ana Silva",
  email: "ana@example.com",
});
assert.equal(good.success, true);
console.log("clients.spec.ts passed");
