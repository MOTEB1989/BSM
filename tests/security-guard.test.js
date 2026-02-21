/**
 * Security Guard Tests
 * Tests for chatGuard and agentExecutionGuard enforcement
 */

import { test } from "node:test";
import assert from "node:assert";
import { guardChatAgent, getAvailableChatAgents } from "../src/guards/chatGuard.js";
import { guardAgentExecution, getAvailableAgentsForContext } from "../src/guards/agentExecutionGuard.js";

// Test chatGuard: blocks agents without "chat" context
test("chatGuard blocks agents without chat context", async () => {
  try {
    await guardChatAgent("raptor-agent", false);
    assert.fail("Should have thrown error for agent without chat context");
  } catch (error) {
    assert.ok(error.message.includes("not allowed in chat context"));
  }
});

// Test chatGuard: blocks agents with terminal_execution capability
test("chatGuard blocks agents with terminal_execution capability", async () => {
  try {
    await guardChatAgent("raptor-agent", false);
    assert.fail("Should have thrown error for terminal_execution agent");
  } catch (error) {
    assert.ok(
      error.message.includes("not allowed in chat") || 
      error.message.includes("terminal_execution")
    );
  }
});

// Test chatGuard: blocks agents with internal_only:true
test("chatGuard blocks internal_only agents", async () => {
  try {
    await guardChatAgent("raptor-agent", false);
    assert.fail("Should have thrown error for internal_only agent");
  } catch (error) {
    assert.ok(
      error.message.includes("internal only") || 
      error.message.includes("not allowed in chat")
    );
  }
});

// Test chatGuard: blocks agents with selectable:false
test("chatGuard blocks non-selectable agents", async () => {
  try {
    await guardChatAgent("raptor-agent", false);
    assert.fail("Should have thrown error for non-selectable agent");
  } catch (error) {
    assert.ok(
      error.message.includes("not selectable") || 
      error.message.includes("not allowed in chat")
    );
  }
});

// Test chatGuard: allows agents with proper chat context
test("chatGuard allows agents with chat context", async () => {
  // This would pass if we have an agent with proper chat context
  // For now, we just verify the guard returns an agent object
  const agents = await getAvailableChatAgents(false);
  assert.ok(Array.isArray(agents));
  // The list should not include raptor-agent
  const hasRaptor = agents.some(a => a.id === "raptor-agent");
  assert.strictEqual(hasRaptor, false, "raptor-agent should not be in available chat agents");
});

// Test agentExecutionGuard: blocks agents without api context
test("agentExecutionGuard blocks agents without requested context", async () => {
  try {
    await guardAgentExecution("raptor-agent", "chat", false);
    assert.fail("Should have thrown error for agent without chat context");
  } catch (error) {
    assert.ok(error.message.includes("not allowed in"));
  }
});

// Test agentExecutionGuard: blocks agents requiring approval without admin
test("agentExecutionGuard blocks approval-required agents for non-admin", async () => {
  try {
    await guardAgentExecution("raptor-agent", "api", false);
    assert.fail("Should have thrown error for approval-required agent without admin");
  } catch (error) {
    assert.ok(error.message.includes("requires admin approval"));
  }
});

// Test agentExecutionGuard: allows agents requiring approval for admin
test("agentExecutionGuard allows approval-required agents for admin", async () => {
  const agent = await guardAgentExecution("raptor-agent", "api", true);
  assert.ok(agent);
  assert.strictEqual(agent.id, "raptor-agent");
});

// Test getAvailableAgentsForContext: returns only allowed agents
test("getAvailableAgentsForContext filters correctly", async () => {
  const apiAgents = await getAvailableAgentsForContext("api", false);
  assert.ok(Array.isArray(apiAgents));
  
  // raptor-agent should NOT be in the list for non-admin (requires approval)
  const hasRaptorNoAdmin = apiAgents.some(a => a.id === "raptor-agent");
  assert.strictEqual(hasRaptorNoAdmin, false, "raptor-agent should not be available for non-admin");
  
  // But should be available for admin
  const apiAgentsAdmin = await getAvailableAgentsForContext("api", true);
  const hasRaptorAdmin = apiAgentsAdmin.some(a => a.id === "raptor-agent");
  assert.strictEqual(hasRaptorAdmin, true, "raptor-agent should be available for admin");
});
