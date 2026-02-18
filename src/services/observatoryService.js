import { getPool } from '../config/database.js';
import { recordMetric, getAggregatedMetrics, recordConversationAnalytics } from './observatoryDbService.js';
import logger from '../utils/logger.js';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

// Get real-time metrics for all agents
export async function getRealTimeMetrics(timeRange = '24h') {
  try {
    const metrics = await getAggregatedMetrics(null, timeRange);
    
    return metrics.map(m => ({
      agentId: m.agent_id,
      totalRequests: parseInt(m.total_requests),
      successfulRequests: parseInt(m.successful_requests),
      successRate: ((parseInt(m.successful_requests) / parseInt(m.total_requests)) * 100).toFixed(2),
      avgResponseTime: parseFloat(m.avg_response_time).toFixed(2),
      maxResponseTime: parseInt(m.max_response_time),
      totalTokens: parseInt(m.total_tokens || 0),
      totalCost: parseFloat(m.total_cost || 0).toFixed(4)
    }));
  } catch (err) {
    logger.error({ err }, 'Failed to get real-time metrics');
    throw err;
  }
}

// Get metrics for specific agent
export async function getAgentMetrics(agentId, timeRange = '24h') {
  try {
    const metrics = await getAggregatedMetrics(agentId, timeRange);
    
    if (metrics.length === 0) {
      return {
        agentId,
        totalRequests: 0,
        successfulRequests: 0,
        successRate: '0.00',
        avgResponseTime: '0.00',
        maxResponseTime: 0,
        totalTokens: 0,
        totalCost: '0.00'
      };
    }
    
    const m = metrics[0];
    return {
      agentId,
      totalRequests: parseInt(m.total_requests),
      successfulRequests: parseInt(m.successful_requests),
      successRate: ((parseInt(m.successful_requests) / parseInt(m.total_requests)) * 100).toFixed(2),
      avgResponseTime: parseFloat(m.avg_response_time).toFixed(2),
      maxResponseTime: parseInt(m.max_response_time),
      totalTokens: parseInt(m.total_tokens || 0),
      totalCost: parseFloat(m.total_cost || 0).toFixed(4)
    };
  } catch (err) {
    logger.error({ err, agentId }, 'Failed to get agent metrics');
    throw err;
  }
}

// Get token usage by agent
export async function getTokenUsageByAgent(timeRange = '24h') {
  const pool = getPool();
  
  const timeIntervals = {
    '1h': '1 hour',
    '6h': '6 hours',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };
  
  const interval = timeIntervals[timeRange] || '24 hours';
  
  try {
    const result = await pool.query(`
      SELECT
        agent_id,
        SUM(tokens_used) as total_tokens,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        COUNT(*) as request_count
      FROM agent_metrics
      WHERE timestamp > NOW() - INTERVAL '${interval}'
      GROUP BY agent_id
      ORDER BY total_tokens DESC
    `);
    
    return result.rows.map(row => ({
      agentId: row.agent_id,
      totalTokens: parseInt(row.total_tokens || 0),
      promptTokens: parseInt(row.total_prompt_tokens || 0),
      completionTokens: parseInt(row.total_completion_tokens || 0),
      requestCount: parseInt(row.request_count)
    }));
  } catch (err) {
    logger.error({ err }, 'Failed to get token usage by agent');
    throw err;
  }
}

// Get token usage by user
export async function getTokenUsageByUser(timeRange = '24h') {
  const pool = getPool();
  
  const timeIntervals = {
    '1h': '1 hour',
    '6h': '6 hours',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };
  
  const interval = timeIntervals[timeRange] || '24 hours';
  
  try {
    const result = await pool.query(`
      SELECT
        user_id,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        COUNT(*) as request_count,
        COUNT(DISTINCT agent_id) as agents_used
      FROM agent_metrics
      WHERE timestamp > NOW() - INTERVAL '${interval}' AND user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY total_tokens DESC
      LIMIT 100
    `);
    
    return result.rows.map(row => ({
      userId: row.user_id,
      totalTokens: parseInt(row.total_tokens || 0),
      totalCost: parseFloat(row.total_cost || 0).toFixed(4),
      requestCount: parseInt(row.request_count),
      agentsUsed: parseInt(row.agents_used)
    }));
  } catch (err) {
    logger.error({ err }, 'Failed to get token usage by user');
    throw err;
  }
}

// Analyze conversation sentiment
export function analyzeSentiment(text) {
  try {
    const result = sentiment.analyze(text);
    
    let label = 'neutral';
    if (result.score > 2) label = 'positive';
    else if (result.score < -2) label = 'negative';
    
    return {
      score: result.score,
      label,
      comparative: result.comparative,
      tokens: result.tokens.length
    };
  } catch (err) {
    logger.error({ err }, 'Failed to analyze sentiment');
    return { score: 0, label: 'neutral', comparative: 0, tokens: 0 };
  }
}

// Get conversation analytics
export async function getConversationAnalytics(timeRange = '24h') {
  const pool = getPool();
  
  const timeIntervals = {
    '1h': '1 hour',
    '6h': '6 hours',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };
  
  const interval = timeIntervals[timeRange] || '24 hours';
  
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_conversations,
        AVG(message_count) as avg_messages_per_conversation,
        AVG(sentiment_score) as avg_sentiment_score,
        COUNT(CASE WHEN sentiment_label = 'positive' THEN 1 END) as positive_count,
        COUNT(CASE WHEN sentiment_label = 'neutral' THEN 1 END) as neutral_count,
        COUNT(CASE WHEN sentiment_label = 'negative' THEN 1 END) as negative_count
      FROM conversation_analytics
      WHERE timestamp > NOW() - INTERVAL '${interval}'
    `);
    
    const row = result.rows[0];
    return {
      totalConversations: parseInt(row.total_conversations || 0),
      avgMessagesPerConversation: parseFloat(row.avg_messages_per_conversation || 0).toFixed(2),
      avgSentimentScore: parseFloat(row.avg_sentiment_score || 0).toFixed(2),
      sentimentDistribution: {
        positive: parseInt(row.positive_count || 0),
        neutral: parseInt(row.neutral_count || 0),
        negative: parseInt(row.negative_count || 0)
      }
    };
  } catch (err) {
    logger.error({ err }, 'Failed to get conversation analytics');
    throw err;
  }
}

// Get time series data for charts
export async function getTimeSeriesMetrics(agentId = null, timeRange = '24h', interval = '1h') {
  const pool = getPool();
  
  const timeIntervals = {
    '1h': { range: '1 hour', bucket: '5 minutes' },
    '6h': { range: '6 hours', bucket: '30 minutes' },
    '24h': { range: '24 hours', bucket: '1 hour' },
    '7d': { range: '7 days', bucket: '6 hours' },
    '30d': { range: '30 days', bucket: '1 day' }
  };
  
  const config = timeIntervals[timeRange] || timeIntervals['24h'];
  const whereClause = agentId ? 'WHERE agent_id = $1 AND' : 'WHERE';
  const params = agentId ? [agentId] : [];
  
  try {
    const result = await pool.query(`
      SELECT
        date_trunc('${config.bucket}', timestamp) as time_bucket,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time,
        COUNT(CASE WHEN success = true THEN 1 END)::float / COUNT(*) * 100 as success_rate
      FROM agent_metrics
      ${whereClause} timestamp > NOW() - INTERVAL '${config.range}'
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `, params);
    
    return result.rows.map(row => ({
      timestamp: row.time_bucket,
      requestCount: parseInt(row.request_count),
      avgResponseTime: parseFloat(row.avg_response_time).toFixed(2),
      successRate: parseFloat(row.success_rate).toFixed(2)
    }));
  } catch (err) {
    logger.error({ err }, 'Failed to get time series metrics');
    throw err;
  }
}

export default {
  getRealTimeMetrics,
  getAgentMetrics,
  getTokenUsageByAgent,
  getTokenUsageByUser,
  analyzeSentiment,
  getConversationAnalytics,
  getTimeSeriesMetrics
};
