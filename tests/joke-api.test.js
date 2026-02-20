import test from "node:test";
import assert from "node:assert/strict";

// Test suite for Random Joke API implementation

test("jokeService module exports getRandomJoke function", async () => {
  const jokeService = await import("../src/services/jokeService.js");
  assert.ok(typeof jokeService.getRandomJoke === "function");
});

test("jokeController module exports getJoke function", async () => {
  const jokeController = await import("../src/controllers/jokeController.js");
  assert.ok(typeof jokeController.getJoke === "function");
});

test("joke route is registered in routes index", async () => {
  const routesIndex = await import("../src/routes/index.js");
  
  // Verify the module loads successfully
  assert.ok(routesIndex.default);
  
  // Verify router is properly configured (has stack)
  assert.ok(routesIndex.default.stack);
  
  // Check that joke route is registered
  const jokeRoute = routesIndex.default.stack.find(
    layer => layer.regexp && layer.regexp.test('/random-joke')
  );
  
  assert.ok(jokeRoute, "Joke route should be registered in routes index");
});

test("joke route follows ES Modules pattern", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const jokeRouteContent = await readFile(
    "./src/routes/joke.js",
    "utf-8"
  );
  
  // Verify ES Modules imports (not CommonJS require)
  assert.ok(
    jokeRouteContent.includes('import'),
    "Should use ES Module import statements"
  );
  assert.ok(
    !jokeRouteContent.includes('require('),
    "Should not use CommonJS require"
  );
  assert.ok(
    jokeRouteContent.includes('export default'),
    "Should use ES Module export default"
  );
});

test("jokeService uses circuit breaker pattern", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const serviceContent = await readFile(
    "./src/services/jokeService.js",
    "utf-8"
  );
  
  // Verify circuit breaker is imported and used
  assert.ok(
    serviceContent.includes('getCircuitBreaker'),
    "Should import circuit breaker"
  );
  assert.ok(
    serviceContent.includes('CircuitBreaker.execute') || serviceContent.includes('jokeApiCircuitBreaker.execute'),
    "Should use circuit breaker execute method"
  );
});

test("jokeService uses node-fetch (not axios)", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const serviceContent = await readFile(
    "./src/services/jokeService.js",
    "utf-8"
  );
  
  // Verify node-fetch is used (BSM standard)
  assert.ok(
    serviceContent.includes('import fetch from "node-fetch"'),
    "Should use node-fetch"
  );
  assert.ok(
    !serviceContent.includes('axios'),
    "Should not use axios"
  );
});

test("jokeController uses asyncHandler pattern", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const routeContent = await readFile(
    "./src/routes/joke.js",
    "utf-8"
  );
  
  // Verify asyncHandler is used
  assert.ok(
    routeContent.includes('asyncHandler'),
    "Should use asyncHandler wrapper"
  );
});

test("jokeController uses httpResponses utilities", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const controllerContent = await readFile(
    "./src/controllers/jokeController.js",
    "utf-8"
  );
  
  // Verify httpResponses utilities are imported
  assert.ok(
    controllerContent.includes('from "../utils/httpResponses.js"'),
    "Should import httpResponses utilities"
  );
  assert.ok(
    controllerContent.includes('serverError'),
    "Should use serverError utility"
  );
});

test("jokeService includes proper error handling", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const serviceContent = await readFile(
    "./src/services/jokeService.js",
    "utf-8"
  );
  
  // Verify error handling patterns
  assert.ok(
    serviceContent.includes('AppError'),
    "Should use AppError for errors"
  );
  assert.ok(
    serviceContent.includes('try'),
    "Should have try-catch block"
  );
  assert.ok(
    serviceContent.includes('catch'),
    "Should have error handling"
  );
  assert.ok(
    serviceContent.includes('finally'),
    "Should have cleanup in finally block"
  );
});

test("jokeService includes timeout handling", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const serviceContent = await readFile(
    "./src/services/jokeService.js",
    "utf-8"
  );
  
  // Verify timeout mechanism
  assert.ok(
    serviceContent.includes('AbortController'),
    "Should use AbortController for timeouts"
  );
  assert.ok(
    serviceContent.includes('REQUEST_TIMEOUT_MS'),
    "Should define request timeout"
  );
  assert.ok(
    serviceContent.includes('setTimeout'),
    "Should set timeout"
  );
  assert.ok(
    serviceContent.includes('clearTimeout'),
    "Should clear timeout in finally"
  );
});

test("jokeService uses structured logging", async () => {
  const { readFile } = await import("node:fs/promises");
  
  const serviceContent = await readFile(
    "./src/services/jokeService.js",
    "utf-8"
  );
  
  // Verify logger is imported and used
  assert.ok(
    serviceContent.includes('import logger'),
    "Should import logger"
  );
  assert.ok(
    serviceContent.includes('logger.info'),
    "Should use logger.info"
  );
  assert.ok(
    serviceContent.includes('logger.error'),
    "Should use logger.error"
  );
});
