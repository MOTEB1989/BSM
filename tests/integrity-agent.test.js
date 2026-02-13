import test from 'node:test';
import assert from 'node:assert/strict';
import { IntegrityAgent } from '../src/agents/IntegrityAgent.js';

test('calculateHealthScore returns structured breakdown and rounded score', () => {
  const agent = new IntegrityAgent();

  const result = agent.calculateHealthScore({
    staleCount: 2,
    oldCount: 3,
    structureScore: 100,
    licenseScore: 50,
    docsScore: 80
  });

  assert.deepEqual(result.componentScores, {
    structureScore: 100,
    licenseScore: 50,
    docsScore: 80
  });
  assert.equal(result.penalties.prPenalty, 10);
  assert.equal(result.penalties.issuePenalty, 6);
  assert.equal(result.avgSystemScore, 77);
  assert.equal(result.finalScore, 61);
});

test('check() exposes health object and healthScore parity', async () => {
  const agent = new IntegrityAgent();
  const result = await agent.check({ prs: [], issues: [] });

  assert.equal(typeof result.healthScore, 'number');
  assert.equal(result.healthScore, result.health.finalScore);
  assert.ok(result.health.componentScores.structureScore >= 0);
});
