#!/usr/bin/env node

/**
 * AI Gateway Integration Test
 * Tests the unified AI gateway endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token';

let testApiKey = null;

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    return false;
  }
}

async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { rawResponse: text };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error?.message || text}`);
  }

  return data;
}

async function runTests() {
  console.log('🚀 Starting AI Gateway Integration Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Token: ${ADMIN_TOKEN ? '***' + ADMIN_TOKEN.slice(-4) : 'NOT SET'}\n`);

  const results = [];

  // Test 1: Health check
  results.push(await test('Health check', async () => {
    const data = await apiCall('/api/health');
    if (!data.status) throw new Error('No status in health response');
  }));

  // Test 2: Swagger documentation
  results.push(await test('Swagger documentation', async () => {
    const response = await fetch(`${BASE_URL}/api-docs/`);
    if (!response.ok) throw new Error('Swagger UI not accessible');
  }));

  // Test 3: Provider status (public endpoint)
  results.push(await test('Provider status (public)', async () => {
    const data = await apiCall('/api/gateway/providers');
    if (!Array.isArray(data.providers)) throw new Error('Invalid providers response');
  }));

  // Test 4: Admin health check
  results.push(await test('Admin health check', async () => {
    const data = await apiCall('/api/gateway/admin/health', {
      headers: { 'X-Admin-Token': ADMIN_TOKEN }
    });
    if (!data.health) throw new Error('No health data in admin response');
  }));

  // Test 5: Create API key
  results.push(await test('Create API key', async () => {
    const data = await apiCall('/api/gateway/admin/api-keys', {
      method: 'POST',
      headers: { 'X-Admin-Token': ADMIN_TOKEN },
      body: JSON.stringify({
        user_id: 'test-user-' + Date.now(),
        description: 'Test API key',
        daily_quota: 100,
        monthly_quota: 3000
      })
    });
    
    if (!data.apiKey) throw new Error('No API key in response');
    testApiKey = data.apiKey;
    console.log(`   Created test API key: ${data.keyPrefix}...`);
  }));

  // Test 6: List API keys
  results.push(await test('List API keys', async () => {
    const data = await apiCall('/api/gateway/admin/api-keys', {
      headers: { 'X-Admin-Token': ADMIN_TOKEN }
    });
    if (!Array.isArray(data.apiKeys)) throw new Error('Invalid API keys response');
    if (data.apiKeys.length === 0) throw new Error('No API keys found after creation');
  }));

  // Test 7: Gateway completion (without provider keys - should fail gracefully)
  results.push(await test('Gateway completion endpoint (no API keys)', async () => {
    try {
      await apiCall('/api/gateway/completions', {
        method: 'POST',
        headers: { 'X-API-Key': testApiKey },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        })
      });
    } catch (err) {
      // Expected to fail if no provider API keys are configured
      if (err.message.includes('providers failed') || err.message.includes('not configured')) {
        console.log('   Expected: No provider API keys configured');
        return;
      }
      throw err;
    }
  }));

  // Test 8: Gateway without auth (should fail)
  results.push(await test('Gateway without auth (should fail)', async () => {
    try {
      await apiCall('/api/gateway/completions', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });
      throw new Error('Should have failed without API key');
    } catch (err) {
      if (err.message.includes('API key required') || err.message.includes('401')) {
        return; // Expected
      }
      throw err;
    }
  }));

  // Test 9: List providers (admin)
  results.push(await test('List providers (admin)', async () => {
    const data = await apiCall('/api/gateway/admin/providers', {
      headers: { 'X-Admin-Token': ADMIN_TOKEN }
    });
    if (!Array.isArray(data.providers)) throw new Error('Invalid providers response');
  }));

  // Test 10: Get pricing
  results.push(await test('Get model pricing', async () => {
    const data = await apiCall('/api/gateway/admin/pricing', {
      headers: { 'X-Admin-Token': ADMIN_TOKEN }
    });
    if (!Array.isArray(data.pricing)) throw new Error('Invalid pricing response');
    if (data.pricing.length === 0) throw new Error('No pricing data found');
  }));

  // Summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${results.length}`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed');
  }

  console.log('\n' + '='.repeat(60));
  
  // Cleanup: Note that we're NOT deleting the test API key for manual verification
  console.log('\nℹ️  Test API key was created and NOT deleted for manual verification');
  console.log(`   You can delete it via: DELETE ${BASE_URL}/api/gateway/admin/api-keys/{id}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('\n💥 Test suite crashed:', err);
  process.exit(1);
});
