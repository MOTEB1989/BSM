import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { handleGitHubWebhook, verifySignature } from "../src/controllers/webhookController.js";

test("verifySignature rejects when GITHUB_WEBHOOK_SECRET is missing", () => {
  const payload = JSON.stringify({ action: "opened" });
  const signature = "sha256=abc123";

  assert.equal(verifySignature(payload, signature, undefined), false);
});

test("verifySignature rejects when signature is missing or malformed", () => {
  const payload = JSON.stringify({ action: "opened" });
  const secret = "super-secret";

  assert.equal(verifySignature(payload, undefined, secret), false);
  assert.equal(verifySignature(payload, "abc123", secret), false);
});

test("verifySignature rejects when signature length does not match digest length", () => {
  const payload = JSON.stringify({ action: "opened", number: 42 });
  const secret = "super-secret";

  assert.equal(verifySignature(payload, "sha256=short", secret), false);
});

test("verifySignature accepts when secret exists and signature is valid", () => {
  const payload = JSON.stringify({ action: "opened", number: 42 });
  const secret = "super-secret";
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;

  assert.equal(verifySignature(payload, signature, secret), true);
});

test("handleGitHubWebhook returns standardized 401 response for invalid signature", async () => {
  const originalSecret = process.env.GITHUB_WEBHOOK_SECRET;
  process.env.GITHUB_WEBHOOK_SECRET = "super-secret";

  const req = {
    headers: {
      "x-hub-signature-256": "sha256=invalid",
      "x-github-event": "pull_request"
    },
    body: { action: "opened", number: 12 }
  };

  let statusCode;
  let jsonBody;
  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      this.headersSent = true;
      return this;
    }
  };

  const next = () => {
    throw new Error("next should not be called for invalid signature");
  };

  await handleGitHubWebhook(req, res, next);

  assert.equal(statusCode, 401);
  assert.deepEqual(jsonBody, {
    error: {
      code: "INVALID_WEBHOOK_SIGNATURE",
      message: "Unauthorized webhook request"
    }
  });

  if (typeof originalSecret === "undefined") {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  } else {
    process.env.GITHUB_WEBHOOK_SECRET = originalSecret;
  }
});


test("handleGitHubWebhook validates signature using rawBody when available", async () => {
  const originalSecret = process.env.GITHUB_WEBHOOK_SECRET;
  process.env.GITHUB_WEBHOOK_SECRET = "super-secret";

  const rawPayload = '{"action":"opened","number":12,"pull_request":{"draft":true}}';
  const signature = `sha256=${crypto.createHmac("sha256", "super-secret").update(rawPayload).digest("hex")}`;

  const req = {
    headers: {
      "x-hub-signature-256": signature,
      "x-github-event": "pull_request"
    },
    rawBody: rawPayload,
    body: { action: "opened", number: 12, pull_request: { draft: true } }
  };

  let statusCode;
  let jsonBody;
  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      this.headersSent = true;
      return this;
    }
  };

  const next = () => {
    throw new Error("next should not be called when signature is valid");
  };

  await handleGitHubWebhook(req, res, next);

  assert.equal(statusCode, 200);
  assert.equal(jsonBody.status, "skipped");

  if (typeof originalSecret === "undefined") {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  } else {
    process.env.GITHUB_WEBHOOK_SECRET = originalSecret;
  }
});
