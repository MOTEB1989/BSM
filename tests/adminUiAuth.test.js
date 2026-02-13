import test from "node:test";
import assert from "node:assert/strict";

import { adminUiAuth } from "../src/middleware/auth.js";
import { env } from "../src/config/env.js";

const createResponse = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
};

test("adminUiAuth rejects query token even when provided alone", () => {
  env.adminToken = "secret-token";

  const req = {
    headers: {},
    query: { token: "secret-token" }
  };
  const res = createResponse();
  let called = false;

  adminUiAuth(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.match(String(res.body), /not allowed/i);
});

test("adminUiAuth accepts correct x-admin-token header", () => {
  env.adminToken = "secret-token";

  const req = {
    headers: { "x-admin-token": "secret-token" },
    query: {}
  };
  const res = createResponse();
  let called = false;

  adminUiAuth(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test("adminUiAuth accepts correct Basic auth password", () => {
  env.adminToken = "secret-token";

  const encoded = Buffer.from("admin:secret-token", "utf8").toString("base64");
  const req = {
    headers: { authorization: `Basic ${encoded}` },
    query: {}
  };
  const res = createResponse();
  let called = false;

  adminUiAuth(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});
