import test from "node:test";
import assert from "node:assert/strict";
import {
  loadKnowledgeIndex,
  getKnowledgeString,
  clearKnowledgeCache
} from "../src/services/knowledgeService.js";

test("loadKnowledgeIndex returns array of documents", async () => {
  const docs = await loadKnowledgeIndex();
  assert(Array.isArray(docs));
});

test("getKnowledgeString returns non-empty when documents exist", async () => {
  const str = await getKnowledgeString();
  assert(typeof str === "string");
});

test("clearKnowledgeCache does not throw", () => {
  clearKnowledgeCache();
});
