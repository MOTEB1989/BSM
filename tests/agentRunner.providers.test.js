import test from "node:test";
import assert from "node:assert/strict";

import { buildAgentProviders } from "../src/runners/agentRunner.js";
import { models } from "../src/config/models.js";

const snapshot = JSON.parse(JSON.stringify(models));

test.after(() => {
  Object.assign(models.openai, snapshot.openai || {});
  Object.assign(models.kimi, snapshot.kimi || {});
  Object.assign(models.perplexity, snapshot.perplexity || {});
  Object.assign(models.anthropic, snapshot.anthropic || {});
});

test("buildAgentProviders includes preferred provider first and falls back to others", () => {
  models.openai.default = "sk-proj-valid-openai-key-123456789012345";
  models.kimi.default = "kimi-valid-key-12345678901234567890";
  models.perplexity.default = "pplx-valid-key-12345678901234567890";
  models.anthropic.default = "sk-ant-api03-123456789012345678901234567890";

  const providers = buildAgentProviders({
    id: "agent-auto",
    modelProvider: "openai",
    modelKey: "default"
  });

  assert.equal(providers[0].type, "openai");
  assert.deepEqual(
    providers.map((provider) => provider.type),
    ["openai", "kimi", "perplexity", "anthropic"]
  );
});

test("buildAgentProviders skips unusable preferred provider key and keeps available fallbacks", () => {
  models.openai.default = "your_api_key_here";
  models.kimi.default = "kimi-valid-key-12345678901234567890";
  models.perplexity.default = "";
  models.anthropic.default = "sk-ant-api03-123456789012345678901234567890";

  const providers = buildAgentProviders({
    id: "agent-auto",
    modelProvider: "openai",
    modelKey: "default"
  });

  assert.deepEqual(
    providers.map((provider) => provider.type),
    ["kimi", "anthropic"]
  );
});
