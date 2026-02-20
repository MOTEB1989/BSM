import test from "node:test";
import assert from "node:assert/strict";
import { CircuitBreaker, getCircuitBreaker, circuitBreakers } from "../src/utils/circuitBreaker.js";

test("CircuitBreaker starts in CLOSED state", () => {
  const cb = new CircuitBreaker({ name: "test-cb", failureThreshold: 2 });
  const state = cb.getState();
  assert.equal(state.state, "CLOSED");
});

test("CircuitBreaker opens after failureThreshold failures", async () => {
  const cb = new CircuitBreaker({ name: "test-open", failureThreshold: 2, resetTimeout: 1000 });

  await assert.rejects(() => cb.execute(() => Promise.reject(new Error("fail1"))));
  await assert.rejects(() => cb.execute(() => Promise.reject(new Error("fail2"))));

  const state = cb.getState();
  assert.equal(state.state, "OPEN");
});

test("CircuitBreaker executes successful callback", async () => {
  const cb = new CircuitBreaker({ name: "test-success" });
  const result = await cb.execute(() => Promise.resolve(42));
  assert.equal(result, 42);
});

test("getCircuitBreaker returns singleton per name", () => {
  const a = getCircuitBreaker("singleton-test");
  const b = getCircuitBreaker("singleton-test");
  assert.strictEqual(a, b);
});
