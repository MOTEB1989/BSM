import test from "node:test";
import assert from "node:assert/strict";
import { buildChatProviders, buildAgentProviders } from "../src/utils/providerUtils.js";

const mockModels = {
  openai: { default: "sk-proj-valid-openai-key-12345678" },
  kimi: { default: "kimi-valid-key-123456789012345" },
  perplexity: { default: "" },
  anthropic: { default: "sk-ant-api03-valid-12345678901234567890" }
};

test("buildChatProviders returns only providers with usable keys", () => {
  const providers = buildChatProviders(mockModels);
  assert.equal(providers.length, 3);
  assert.deepEqual(
    providers.map((p) => p.type),
    ["openai", "kimi", "anthropic"]
  );
});

test("buildChatProviders returns empty when no keys", () => {
  const empty = { openai: { default: "" }, kimi: {}, perplexity: {}, anthropic: {} };
  const providers = buildChatProviders(empty);
  assert.equal(providers.length, 0);
});

test("buildAgentProviders prefers agent modelProvider", () => {
  const providers = buildAgentProviders(mockModels, {
    modelProvider: "anthropic",
    modelKey: "default"
  });
  assert.equal(providers[0].type, "anthropic");
});

test("buildAgentProviders skips preferred when key unusable", () => {
  const models = { ...mockModels, openai: { default: "your_api_key_here" } };
  const providers = buildAgentProviders(models, {
    modelProvider: "openai",
    modelKey: "default"
  });
  assert.notEqual(providers[0]?.type, "openai");
});
