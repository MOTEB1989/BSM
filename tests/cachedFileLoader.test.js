import test from "node:test";
import assert from "node:assert/strict";
import { createCachedFileLoader, createYAMLLoader } from "../src/utils/cachedFileLoader.js";

test("createCachedFileLoader returns load and clear functions", () => {
  const loader = createCachedFileLoader({
    name: "test",
    dirPath: "data/agents",
    indexFile: "index.json",
    indexKey: "agents",
    parser: (c) => c,
    validator: () => true,
    cacheTTL: 1000
  });
  assert.equal(typeof loader.load, "function");
  assert.equal(typeof loader.clear, "function");
});

test("createYAMLLoader parses YAML files", async () => {
  const loader = createYAMLLoader({
    name: "agents",
    dirPath: "data/agents",
    indexFile: "index.json",
    indexKey: "agents",
    validator: (parsed) => !!parsed?.id,
    cacheTTL: 60000
  });

  const data = await loader.load();
  assert(Array.isArray(data));
  assert(data.length > 0);
  assert(data.every((a) => a && typeof a.id === "string"));
});
