import { query } from '../../database/client.js';
import logger from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';

// Model pricing per 1M tokens (USD)
const MODEL_PRICING = {
  // OpenAI
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  
  // Anthropic
  'claude-3-opus': { input: 15.0, output: 75.0 },
  'claude-3-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  
  // Google
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-pro-vision': { input: 0.5, output: 1.5 },
  
  // Perplexity
  'sonar-small': { input: 0.2, output: 0.2 },
  'sonar-medium': { input: 0.6, output: 0.6 },
  'sonar-large': { input: 3.0, output: 3.0 },
  
  // Kimi (Moonshot)
  'moonshot-v1-8k': { input: 0.12, output: 0.12 },
  'moonshot-v1-32k': { input: 0.24, output: 0.24 },
  'moonshot-v1-128k': { input: 0.6, output: 0.6 }
};

export class AIProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.modelsCache = null;
    this.lastCacheUpdate = null;
  }

  async loadProviders() {
    try {
      const result = await query(
        'SELECT * FROM gateway_providers WHERE enabled = true ORDER BY priority DESC'
      );
      
      this.providers.clear();
      for (const row of result.rows) {
        this.providers.set(row.id, {
          id: row.id,
          name: row.name,
          type: row.type,
          apiUrl: row.api_url,
          priority: row.priority,
          config: row.config || {}
        });
      }
      
      logger.info({ count: this.providers.size }, 'Loaded AI providers');
      return Array.from(this.providers.values());
    } catch (error) {
      logger.warn({ error: error.message }, 'Failed to load providers from database, using defaults');
      // Return default providers if database is not available
      return this.getDefaultProviders();
    }
  }

  getDefaultProviders() {
    return [
      { id: 1, name: 'OpenAI GPT-4o-mini', type: 'openai', priority: 80 },
      { id: 2, name: 'Claude 3 Sonnet', type: 'anthropic', priority: 85 },
      { id: 3, name: 'Gemini Pro', type: 'google', priority: 75 }
    ];
  }

  async getProvider(id) {
    if (this.providers.size === 0) {
      await this.loadProviders();
    }
    return this.providers.get(id);
  }

  async getProvidersByType(type) {
    if (this.providers.size === 0) {
      await this.loadProviders();
    }
    return Array.from(this.providers.values())
      .filter(p => p.type === type)
      .sort((a, b) => b.priority - a.priority);
  }

  async getAllProviders() {
    if (this.providers.size === 0) {
      await this.loadProviders();
    }
    return Array.from(this.providers.values())
      .sort((a, b) => b.priority - a.priority);
  }

  async getProviderByPriority(excludeIds = []) {
    const providers = await this.getAllProviders();
    return providers.find(p => !excludeIds.includes(p.id));
  }

  getApiKey(type) {
    const keyMap = {
      openai: process.env.OPENAI_BSM_KEY || 
              process.env.OPENAI_BSU_KEY || 
              process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
      kimi: process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY,
      perplexity: process.env.PERPLEXITY_KEY
    };
    
    return keyMap[type] || null;
  }

  hasApiKey(type) {
    return Boolean(this.getApiKey(type));
  }

  getAvailableProviders() {
    return Array.from(this.providers.values())
      .filter(p => this.hasApiKey(p.type))
      .sort((a, b) => b.priority - a.priority);
  }

  calculateCost(model, promptTokens, completionTokens) {
    // Normalize model name for pricing lookup
    const normalizedModel = this.normalizeModelName(model);
    const pricing = MODEL_PRICING[normalizedModel];
    
    if (!pricing) {
      logger.warn({ model }, 'No pricing information for model');
      return 0;
    }
    
    const inputCost = (promptTokens / 1000000) * pricing.input;
    const outputCost = (completionTokens / 1000000) * pricing.output;
    
    return inputCost + outputCost;
  }

  normalizeModelName(model) {
    // Handle model name variations
    if (model.includes('gpt-4o-mini')) return 'gpt-4o-mini';
    if (model.includes('gpt-4o')) return 'gpt-4o';
    if (model.includes('gpt-4')) return 'gpt-4';
    if (model.includes('gpt-3.5')) return 'gpt-3.5-turbo';
    if (model.includes('claude-3-opus')) return 'claude-3-opus';
    if (model.includes('claude-3-sonnet')) return 'claude-3-sonnet';
    if (model.includes('claude-3-haiku')) return 'claude-3-haiku';
    if (model.includes('gemini-pro-vision')) return 'gemini-pro-vision';
    if (model.includes('gemini')) return 'gemini-pro';
    if (model.includes('sonar-small')) return 'sonar-small';
    if (model.includes('sonar-medium')) return 'sonar-medium';
    if (model.includes('sonar')) return 'sonar-large';
    if (model.includes('moonshot') && model.includes('128')) return 'moonshot-v1-128k';
    if (model.includes('moonshot') && model.includes('32')) return 'moonshot-v1-32k';
    if (model.includes('moonshot')) return 'moonshot-v1-8k';
    
    return model;
  }

  getCheapestModel(taskType = 'chat') {
    // Task-specific model recommendations
    const taskModels = {
      chat: ['gpt-4o-mini', 'claude-3-haiku', 'gemini-pro', 'moonshot-v1-8k'],
      code: ['claude-3-sonnet', 'gpt-4o', 'claude-3-opus'],
      analysis: ['claude-3-opus', 'gpt-4o', 'claude-3-sonnet'],
      search: ['sonar-medium', 'gemini-pro']
    };

    const candidates = taskModels[taskType] || taskModels.chat;
    
    // Return the cheapest available model
    for (const model of candidates) {
      const pricing = MODEL_PRICING[model];
      if (pricing) {
        // Check if we have API key for this model type
        const type = this.getProviderTypeFromModel(model);
        if (this.hasApiKey(type)) {
          return { model, pricing };
        }
      }
    }

    // Fallback to cheapest available
    return { model: 'gpt-4o-mini', pricing: MODEL_PRICING['gpt-4o-mini'] };
  }

  getProviderTypeFromModel(model) {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('gemini')) return 'google';
    if (model.startsWith('sonar')) return 'perplexity';
    if (model.startsWith('moonshot')) return 'kimi';
    return 'openai';
  }

  async addProvider(data) {
    const result = await query(
      `INSERT INTO gateway_providers (name, type, api_url, priority, enabled, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.name, data.type, data.apiUrl, data.priority || 50, data.enabled !== false, data.config || {}]
    );
    
    await this.loadProviders();
    return result.rows[0];
  }

  async updateProvider(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(data.priority);
    }
    if (data.enabled !== undefined) {
      updates.push(`enabled = $${paramCount++}`);
      values.push(data.enabled);
    }
    if (data.config !== undefined) {
      updates.push(`config = $${paramCount++}`);
      values.push(data.config);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(id);
    const result = await query(
      `UPDATE gateway_providers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Provider not found', 404);
    }

    await this.loadProviders();
    return result.rows[0];
  }

  async deleteProvider(id) {
    const result = await query('DELETE FROM gateway_providers WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new AppError('Provider not found', 404);
    }
    await this.loadProviders();
  }
}

export const providerRegistry = new AIProviderRegistry();
