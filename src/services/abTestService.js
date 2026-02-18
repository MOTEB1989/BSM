import { getPool } from '../config/database.js';
import logger from '../utils/logger.js';

// Create A/B test configuration
export async function createABTest(testConfig) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      INSERT INTO ab_test_configs (
        test_name, agent_id, variant_a, variant_b, active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      testConfig.testName,
      testConfig.agentId,
      JSON.stringify(testConfig.variantA),
      JSON.stringify(testConfig.variantB),
      testConfig.active !== false
    ]);
    
    logger.info({ testId: result.rows[0].id, testName: testConfig.testName }, 'A/B test created');
    return result.rows[0];
  } catch (err) {
    logger.error({ err, testConfig }, 'Failed to create A/B test');
    throw err;
  }
}

// Get all active A/B tests
export async function getActiveABTests() {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT * FROM ab_test_configs
      WHERE active = true
      ORDER BY created_at DESC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      testName: row.test_name,
      agentId: row.agent_id,
      variantA: row.variant_a,
      variantB: row.variant_b,
      active: row.active,
      createdAt: row.created_at
    }));
  } catch (err) {
    logger.error({ err }, 'Failed to get active A/B tests');
    throw err;
  }
}

// Get A/B test by ID
export async function getABTest(testId) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT * FROM ab_test_configs WHERE id = $1
    `, [testId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      testName: row.test_name,
      agentId: row.agent_id,
      variantA: row.variant_a,
      variantB: row.variant_b,
      active: row.active,
      createdAt: row.created_at
    };
  } catch (err) {
    logger.error({ err, testId }, 'Failed to get A/B test');
    throw err;
  }
}

// Record A/B test result
export async function recordABTestResult(testId, variant, result) {
  const pool = getPool();
  
  try {
    await pool.query(`
      INSERT INTO ab_test_results (
        test_id, variant, user_id, response_time_ms, success,
        tokens_used, cost_usd, user_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      testId,
      variant,
      result.userId || null,
      result.responseTimeMs || null,
      result.success || null,
      result.tokensUsed || null,
      result.costUsd || null,
      result.userRating || null
    ]);
    
    logger.debug({ testId, variant }, 'A/B test result recorded');
  } catch (err) {
    logger.error({ err, testId, variant }, 'Failed to record A/B test result');
    throw err;
  }
}

// Get A/B test results and statistics
export async function getABTestResults(testId) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT
        variant,
        COUNT(*) as sample_size,
        AVG(response_time_ms) as avg_response_time,
        COUNT(CASE WHEN success = true THEN 1 END)::float / COUNT(*) * 100 as success_rate,
        AVG(tokens_used) as avg_tokens,
        AVG(cost_usd) as avg_cost,
        AVG(user_rating) as avg_rating
      FROM ab_test_results
      WHERE test_id = $1
      GROUP BY variant
    `, [testId]);
    
    const results = {};
    for (const row of result.rows) {
      results[row.variant] = {
        sampleSize: parseInt(row.sample_size),
        avgResponseTime: parseFloat(row.avg_response_time || 0).toFixed(2),
        successRate: parseFloat(row.success_rate || 0).toFixed(2),
        avgTokens: parseFloat(row.avg_tokens || 0).toFixed(2),
        avgCost: parseFloat(row.avg_cost || 0).toFixed(6),
        avgRating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(2) : null
      };
    }
    
    return results;
  } catch (err) {
    logger.error({ err, testId }, 'Failed to get A/B test results');
    throw err;
  }
}

// Assign user to variant (simple random 50/50 split)
export function assignVariant(testId, userId) {
  // Use hash of userId + testId to ensure consistent assignment
  const hash = `${userId}-${testId}`.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  return Math.abs(hash) % 2 === 0 ? 'A' : 'B';
}

// Update A/B test status
export async function updateABTestStatus(testId, active) {
  const pool = getPool();
  
  try {
    await pool.query(`
      UPDATE ab_test_configs
      SET active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [active, testId]);
    
    logger.info({ testId, active }, 'A/B test status updated');
  } catch (err) {
    logger.error({ err, testId }, 'Failed to update A/B test status');
    throw err;
  }
}

export default {
  createABTest,
  getActiveABTests,
  getABTest,
  recordABTestResult,
  getABTestResults,
  assignVariant,
  updateABTestStatus
};
