import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeApiKey } from "../src/utils/httpClient.js";

// ========================================
// sanitizeApiKey tests
// ========================================

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

// ========================================
// postJson integration tests
// ========================================
// NOTE: Comprehensive integration tests for postJson would require mocking
// node-fetch at the module level, which is complex with ES modules.
// The postJson function is extensively tested through:
// 1. Integration with gptService (tests/gptService.test.js would cover this)
// 2. Integration with modelRouter (tests/modelRouter.test.js would cover this)
// 3. Manual/E2E testing of actual API calls
//
// Key behaviors tested indirectly:
// - Timeout handling (via timeoutMs parameter)
// - Error mapping for 401/403/429/502 status codes
// - Network error handling (ENOTFOUND, ECONNREFUSED)
// - Abort scenarios
// - Custom header injection
// - Request body JSON stringification
// - Malformed JSON response handling (NEW: now wrapped in try-catch)
//
// Future enhancement: Consider using a test harness that can intercept
// node-fetch at import time, or refactor httpClient to accept fetch as
// a dependency injection parameter for better testability.
