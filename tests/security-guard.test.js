/**
 * Security Guard Tests
 * Verifies context enforcement for chat and agent execution
 * 
 * Note: These are integration tests that validate the guard logic.
 * The registry is loaded from the actual registry.yaml file.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { guardChatAgent, getAvailableChatAgents } from "../src/guards/chatGuard.js";

test("guardChatAgent should block raptor-agent without chat context", async () => {
  // raptor-agent has contexts: [api, ci] and terminal_execution capability
  // It should be blocked from chat UI
  await assert.rejects(
    async () => await guardChatAgent("raptor-agent", false),
    (err) => {
      assert.match(err.message, /not available in chat UI/);
      return true;
    }
  );
});

test("guardChatAgent should block raptor-agent even for admin (terminal_execution)", async () => {
  // Even admins should not be able to run terminal_execution agents in chat
  await assert.rejects(
    async () => await guardChatAgent("raptor-agent", true),
    (err) => {
      // Will fail because raptor-agent doesn't have "chat" in contexts
      assert.match(err.message, /not available in chat UI/);
      return true;
    }
  );
});

test("getAvailableChatAgents should filter out raptor-agent", async () => {
  const agents = await getAvailableChatAgents(false);
  
  // raptor-agent should not be in the list
  const raptorAgent = agents.find(a => a.id === "raptor-agent");
  assert.equal(raptorAgent, undefined, "raptor-agent should not be available in chat");
});

test("getAvailableChatAgents should filter out agents with terminal_execution", async () => {
  const agents = await getAvailableChatAgents(false);
  
  // Verify no agents with terminal_execution capability are included
  // We can't verify the capability directly from the returned agents,
  // but we know raptor-agent has it and should be excluded
  const agentIds = agents.map(a => a.id);
  assert.equal(agentIds.includes("raptor-agent"), false);
});

test("guardChatAgent should reject execution if agent requires chat context", async () => {
  // This test validates the fail-closed behavior
  // If an agent doesn't have "chat" in contexts.allowed, it should be blocked
  
  // Create a test scenario with a known agent that doesn't have chat context
  // raptor-agent is a good example (contexts: [api, ci])
  await assert.rejects(
    async () => await guardChatAgent("raptor-agent", false),
    (err) => {
      assert.ok(err.message.includes("not available in chat UI") || 
                err.message.includes("registry unavailable"),
                "Should block agents without chat context");
      return true;
    }
  );
});

test("getAvailableChatAgents returns array of agent objects", async () => {
  const agents = await getAvailableChatAgents(false);
  
  // Should return an array
  assert.ok(Array.isArray(agents));
  
  // Each agent should have required fields
  if (agents.length > 0) {
    const firstAgent = agents[0];
    assert.ok(firstAgent.id, "Agent should have id");
    assert.ok(firstAgent.name, "Agent should have name");
  }
});

test("getAvailableChatAgents admin vs non-admin filtering", async () => {
  const nonAdminAgents = await getAvailableChatAgents(false);
  const adminAgents = await getAvailableChatAgents(true);
  
  // Admin should have equal or more agents available
  assert.ok(adminAgents.length >= nonAdminAgents.length,
    "Admin should have at least as many agents as non-admin");
});
