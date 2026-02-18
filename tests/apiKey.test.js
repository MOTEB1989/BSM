import test from "node:test";
import assert from "node:assert/strict";

import { hasUsableApiKey } from "../src/utils/apiKey.js";

test("hasUsableApiKey rejects empty/placeholder values", () => {
  assert.equal(hasUsableApiKey(""), false);
  assert.equal(hasUsableApiKey("your_api_key_here"), false);
  assert.equal(hasUsableApiKey("sk-test-1234567890abcdefghijkl"), false);
  assert.equal(hasUsableApiKey("short-key"), false);
});

test("hasUsableApiKey accepts realistic key values", () => {
  assert.equal(hasUsableApiKey("sk-proj-1234567890abcdefghijklmnopqrst"), true);
  assert.equal(hasUsableApiKey("pplx_1234567890abcdefghijklmnop"), true);
});
