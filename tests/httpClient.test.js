import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeApiKey } from "../src/utils/httpClient.js";

test("sanitizeApiKey removes whitespace and invisible characters", () => {
  const key = "sk-  proj\t\n123  ";
  assert.equal(sanitizeApiKey(key), "sk-proj123");
});

test("sanitizeApiKey handles empty string", () => {
  assert.equal(sanitizeApiKey(""), "");
});

test("sanitizeApiKey handles non-string", () => {
  assert.equal(sanitizeApiKey(null), "");
  assert.equal(sanitizeApiKey(undefined), "");
});
