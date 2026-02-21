/**
 * Security Guard Integration Tests
 * Validates guardChatAgent enforces context restrictions
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { guardChatAgent, getAvailableChatAgents } from '../src/guards/chatGuard.js';

test('guardChatAgent blocks raptor-agent from chat context', async () => {
  await assert.rejects(
    async () => guardChatAgent('raptor-agent', false),
    /not allowed in chat context/,
    'Should block raptor-agent in chat'
  );
});

test('guardChatAgent blocks my-agent from chat context', async () => {
  await assert.rejects(
    async () => guardChatAgent('my-agent', false),
    /not allowed in chat context/,
    'Should block my-agent in chat'
  );
});

test('guardChatAgent allows direct mode', async () => {
  const result = await guardChatAgent('direct', false);
  assert.strictEqual(result.id, 'direct');
  assert.strictEqual(result.allowed, true);
});

test('guardChatAgent allows legal-agent with chat context', async () => {
  const result = await guardChatAgent('legal-agent', false);
  assert.strictEqual(result.id, 'legal-agent');
});

test('guardChatAgent allows kimi-agent with chat context', async () => {
  const result = await guardChatAgent('kimi-agent', false);
  assert.strictEqual(result.id, 'kimi-agent');
});

test('getAvailableChatAgents excludes terminal_execution agents', async () => {
  const agents = await getAvailableChatAgents(false);
  const hasRaptor = agents.some(a => a.id === 'raptor-agent');
  const hasMyAgent = agents.some(a => a.id === 'my-agent');
  
  assert.strictEqual(hasRaptor, false, 'Should not include raptor-agent');
  assert.strictEqual(hasMyAgent, false, 'Should not include my-agent');
});

test('getAvailableChatAgents includes chat-enabled agents', async () => {
  const agents = await getAvailableChatAgents(false);
  const hasLegal = agents.some(a => a.id === 'legal-agent');
  const hasKimi = agents.some(a => a.id === 'kimi-agent');
  
  assert.ok(hasLegal || hasKimi, 'Should include at least legal or kimi agent');
});
