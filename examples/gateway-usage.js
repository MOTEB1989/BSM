#!/usr/bin/env node
/**
 * BSM Unified AI Gateway - Example Usage
 * 
 * This script demonstrates how to use the Unified AI Gateway API
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/gateway';
const API_KEY = process.env.GATEWAY_API_KEY || 'test_key';

async function example1_basicChat() {
  console.log('\n=== Example 1: Basic Chat ===');
  
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is 2+2?' }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 100
    })
  });

  const data = await response.json();
  console.log('Response:', data.data?.response);
  console.log('Cost:', `$${data.data?.cost}`);
  console.log('Provider:', data.data?.provider?.name);
  console.log('Cached:', data.data?.cached);
}

async function example2_costOptimized() {
  console.log('\n=== Example 2: Cost-Optimized Request ===');
  
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Write a haiku about coding' }
      ],
      task_type: 'chat',
      cost_optimize: true,  // Use cheapest model for this task
      use_cache: true
    })
  });

  const data = await response.json();
  console.log('Response:', data.data?.response);
  console.log('Cost:', `$${data.data?.cost}`);
  console.log('Model:', data.data?.provider?.name);
}

async function example3_listProviders() {
  console.log('\n=== Example 3: List Available Providers ===');
  
  const response = await fetch(`${API_BASE}/providers`);
  const data = await response.json();
  
  console.log('Available Providers:');
  for (const provider of data.data) {
    console.log(`  - ${provider.name} (${provider.type}) - Priority: ${provider.priority} - Available: ${provider.available}`);
  }
}

async function example4_listModels() {
  console.log('\n=== Example 4: List Available Models ===');
  
  const response = await fetch(`${API_BASE}/models`);
  const data = await response.json();
  
  console.log('Available Models:');
  const grouped = {};
  for (const model of data.data) {
    if (!grouped[model.providerType]) {
      grouped[model.providerType] = [];
    }
    grouped[model.providerType].push(model.model);
  }
  
  for (const [type, models] of Object.entries(grouped)) {
    console.log(`  ${type}:`, models.join(', '));
  }
}

async function example5_testProviders() {
  console.log('\n=== Example 5: Test All Providers ===');
  
  const response = await fetch(`${API_BASE}/test`);
  const data = await response.json();
  
  console.log('Provider Test Results:');
  for (const result of data.data) {
    const status = result.available ? '✅' : '❌';
    const time = result.responseTime ? `(${result.responseTime}ms)` : '';
    console.log(`  ${status} ${result.provider} - ${result.status} ${time}`);
  }
}

async function example6_withFallback() {
  console.log('\n=== Example 6: Automatic Fallback ===');
  
  // This demonstrates fallback when a provider is unavailable
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Explain quantum computing in one sentence.' }
      ],
      model: 'gpt-4o-mini'
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Response:', data.data.response);
    console.log('Fallback Chain:', data.data.fallbackChain?.join(' → '));
    console.log('Attempt Count:', data.data.attemptCount);
  } else {
    console.error('Error:', data.error);
  }
}

async function example7_getStats() {
  console.log('\n=== Example 7: Gateway Statistics ===');
  
  const response = await fetch(`${API_BASE}/stats?hours=24`);
  const data = await response.json();
  
  console.log('Gateway Statistics (last 24 hours):');
  console.log('  Total Requests:', data.data.requests?.total_requests || 0);
  console.log('  Success Rate:', 
    `${((data.data.requests?.success_count / data.data.requests?.total_requests) * 100 || 0).toFixed(2)}%`
  );
  console.log('  Cache Hit Rate:', 
    `${((data.data.requests?.cached_count / data.data.requests?.total_requests) * 100 || 0).toFixed(2)}%`
  );
  console.log('  Total Cost:', `$${data.data.requests?.total_cost || 0}`);
  console.log('  Cost Saved (Cache):', `$${data.data.cache?.total_cost_saved || 0}`);
}

async function example8_conversationWithHistory() {
  console.log('\n=== Example 8: Conversation with History ===');
  
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
  ];
  
  // First message
  let response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ messages, model: 'gpt-4o-mini' })
  });
  
  let data = await response.json();
  const firstResponse = data.data.response;
  console.log('User: What is the capital of France?');
  console.log('AI:', firstResponse);
  
  // Add response to history
  messages.push({ role: 'assistant', content: firstResponse });
  messages.push({ role: 'user', content: 'What is its population?' });
  
  // Second message with history
  response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ messages, model: 'gpt-4o-mini' })
  });
  
  data = await response.json();
  console.log('User: What is its population?');
  console.log('AI:', data.data.response);
  console.log('\nNote: Second request may be cached if identical!');
}

async function runAllExamples() {
  console.log('==============================================');
  console.log('BSM Unified AI Gateway - Example Usage');
  console.log('==============================================');
  
  try {
    await example3_listProviders();
    await example4_listModels();
    await example5_testProviders();
    
    // Only run chat examples if we have API keys configured
    const testResponse = await fetch(`${API_BASE}/providers`);
    const testData = await testResponse.json();
    const hasAvailableProvider = testData.data?.some(p => p.available);
    
    if (hasAvailableProvider) {
      await example1_basicChat();
      await example2_costOptimized();
      await example6_withFallback();
      await example8_conversationWithHistory();
    } else {
      console.log('\n⚠️  No AI provider API keys configured. Skipping chat examples.');
      console.log('   Configure API keys in .env to test chat functionality.');
    }
    
    await example7_getStats();
    
    console.log('\n==============================================');
    console.log('Examples completed successfully!');
    console.log('==============================================');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message);
    }
  }
}

// Run all examples
runAllExamples();
