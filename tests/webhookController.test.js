import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { verifySignature } from "../src/controllers/webhookController.js";

test("verifySignature rejects when GITHUB_WEBHOOK_SECRET is missing", () => {
  const payload = JSON.stringify({ action: "opened" });
  const signature = "sha256=abc123";

  assert.equal(verifySignature(payload, signature, undefined), false);
});

test("verifySignature accepts when secret exists and signature is valid", () => {
  const payload = JSON.stringify({ action: "opened", number: 42 });
  const secret = "super-secret";
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;

  assert.equal(verifySignature(payload, signature, secret), true);
});
