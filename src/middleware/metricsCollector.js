import { recordMetric } from '../services/observatoryDbService.js';
import logger from '../utils/logger.js';

// Middleware to track agent performance metrics
export function metricsCollectorMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to capture response
  res.json = function(body) {
    const responseTime = Date.now() - startTime;
    
    // Extract metrics from request/response
    const metric = {
      agentId: req.body?.agentId || req.params?.agentId || 'unknown',
      userId: req.headers['x-user-id'] || req.ip,
      responseTimeMs: responseTime,
      success: res.statusCode >= 200 && res.statusCode < 300,
      model: req.body?.model || null,
      tokensUsed: body?.usage?.total_tokens || 0,
      promptTokens: body?.usage?.prompt_tokens || 0,
      completionTokens: body?.usage?.completion_tokens || 0,
      costUsd: calculateCost(body?.usage, req.body?.model),
      errorMessage: body?.error || null,
      metadata: {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent']
      }
    };
    
    // Record metric asynchronously (don't block response)
    recordMetric(metric).catch(err => {
      logger.error({ err }, 'Failed to record metric in middleware');
    });
    
    // Call original json method
    return originalJson(body);
  };
  
  next();
}

// Calculate cost based on model and tokens
function calculateCost(usage, model) {
  if (!usage || !usage.total_tokens) return 0;
  
  // Cost per 1K tokens (as of 2024)
  const costMap = {
    'gpt-4': { prompt: 0.03, completion: 0.06 },
    'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
    'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    'claude-3-opus': { prompt: 0.015, completion: 0.075 },
    'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
    'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
    'gemini-pro': { prompt: 0.00025, completion: 0.00125 }
  };
  
  const modelKey = Object.keys(costMap).find(key => model?.includes(key));
  if (!modelKey) return usage.total_tokens * 0.0001; // Default fallback
  
  const costs = costMap[modelKey];
  const promptCost = (usage.prompt_tokens || 0) * costs.prompt / 1000;
  const completionCost = (usage.completion_tokens || 0) * costs.completion / 1000;
  
  return promptCost + completionCost;
}

export default metricsCollectorMiddleware;
