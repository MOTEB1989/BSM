/**
 * Integration Tests for AI Providers
 * 
 * Tests all 5 AI provider integrations:
 * - OpenAI (GPT-4)
 * - Google Gemini
 * - Anthropic Claude
 * - Perplexity
 * - Moonshot Kimi
 * 
 * @module tests/integration/ai-providers.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  return { response, data };
}

/**
 * Test suite for AI Provider Integration
 */
describe('AI Provider Integration Tests', () => {
  
  /**
   * Test provider status endpoint
   */
  describe('Provider Status', () => {
    it('should return status for all providers', async () => {
      const { response, data } = await apiRequest('/chat/key-status');
      
      assert.strictEqual(response.status, 200, 'Status code should be 200');
      assert.ok(data.providers, 'Response should contain providers object');
      
      // Check for all 5 providers
      const expectedProviders = ['openai', 'gemini', 'anthropic', 'perplexity', 'kimi'];
      expectedProviders.forEach(provider => {
        assert.ok(
          data.providers[provider],
          `Provider ${provider} should be in status response`
        );
      });
    });
  });

  /**
   * Test bilingual support
   */
  describe('Bilingual Support', () => {
    it('should detect Arabic language', async () => {
      const { data } = await apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'ما هو الذكاء الاصطناعي؟',
          destination: 'gemini-agent',
          language: 'ar'
        })
      });

      assert.strictEqual(data.data?.language, 'ar', 'Should detect Arabic');
      assert.strictEqual(data.data?.direction, 'rtl', 'Should use RTL direction');
    });
  });

  /**
   * Test error handling
   */
  describe('Error Handling', () => {
    it('should handle invalid agent', async () => {
      const { response, data } = await apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          destination: 'invalid-agent',
          language: 'en'
        })
      });

      assert.ok(
        response.status >= 400,
        'Should return error status for invalid agent'
      );
    });
  });

  /**
   * Test SAMA compliance features
   */
  describe('SAMA Compliance', () => {
    it('should include security headers', async () => {
      const { response } = await apiRequest('/health');

      assert.ok(
        response.headers.get('x-content-type-options') === 'nosniff',
        'Should include X-Content-Type-Options header'
      );
    });
  });
});
