#!/usr/bin/env node

/**
 * AI Gateway Usage Examples
 * Demonstrates how to use the unified AI gateway
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.GATEWAY_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: GATEWAY_API_KEY environment variable is required');
  console.error('\nUsage:');
  console.error('  export GATEWAY_API_KEY=bsu_your_api_key_here');
  console.error('  node scripts/gateway-examples.js');
  process.exit(1);
}

async function callGateway(endpoint, body) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

async function runExamples() {
  console.log('🚀 AI Gateway Usage Examples\n');

  // Example 1: Simple chat
  console.log('1️⃣  Simple Chat\n');
  try {
    const response = await callGateway('/api/gateway/chat', {
      message: 'What is the capital of France?'
    });
    console.log('✅ Response:', response.choices[0].message.content);
    console.log(`   Provider: ${response.provider}, Model: ${response.model}`);
    console.log(`   Tokens: ${response.usage.total_tokens}, Time: ${response.response_time_ms}ms`);
    console.log(`   From cache: ${response.from_cache}\n`);
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // Example 2: Conversation with history
  console.log('2️⃣  Chat with History\n');
  try {
    const response = await callGateway('/api/gateway/chat', {
      message: 'What about Germany?',
      history: [
        { role: 'user', content: 'What is the capital of France?' },
        { role: 'assistant', content: 'The capital of France is Paris.' }
      ]
    });
    console.log('✅ Response:', response.choices[0].message.content);
    console.log(`   Provider: ${response.provider}\n`);
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // Example 3: Code generation with cost optimization
  console.log('3️⃣  Code Generation (Low Budget)\n');
  try {
    const response = await callGateway('/api/gateway/completions', {
      messages: [
        { role: 'user', content: 'Write a Python function to calculate fibonacci numbers' }
      ],
      task_type: 'code_generation',
      budget: 'low',
      temperature: 0.3
    });
    console.log('✅ Response:', response.choices[0].message.content.substring(0, 200) + '...');
    console.log(`   Provider: ${response.provider}, Model: ${response.model}`);
    console.log(`   Budget: low (cost-optimized)\n`);
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // Example 4: Using specific provider
  console.log('4️⃣  Specific Provider Request\n');
  try {
    const response = await callGateway('/api/gateway/completions', {
      messages: [
        { role: 'system', content: 'You are a helpful coding assistant.' },
        { role: 'user', content: 'Explain what is a closure in JavaScript' }
      ],
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7
    });
    console.log('✅ Response:', response.choices[0].message.content.substring(0, 200) + '...');
    console.log(`   Provider: ${response.provider}, Model: ${response.model}\n`);
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // Example 5: Analysis task (high budget)
  console.log('5️⃣  Analysis Task (High Budget)\n');
  try {
    const response = await callGateway('/api/gateway/completions', {
      messages: [
        { role: 'user', content: 'Analyze the pros and cons of microservices architecture' }
      ],
      task_type: 'analysis',
      budget: 'high',
      temperature: 0.5,
      max_tokens: 800
    });
    console.log('✅ Response:', response.choices[0].message.content.substring(0, 200) + '...');
    console.log(`   Provider: ${response.provider}, Model: ${response.model}`);
    console.log(`   Budget: high (quality-optimized)\n`);
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // Example 6: Caching demonstration
  console.log('6️⃣  Caching Demo (Same Request Twice)\n');
  const cacheTestMessage = {
    messages: [
      { role: 'user', content: 'What is 2 + 2?' }
    ],
    temperature: 0.7
  };

  try {
    console.log('   First request (cache miss)...');
    const response1 = await callGateway('/api/gateway/completions', cacheTestMessage);
    console.log(`   ⏱️  Time: ${response1.response_time_ms}ms, From cache: ${response1.from_cache}`);

    console.log('   Second request (cache hit)...');
    const response2 = await callGateway('/api/gateway/completions', cacheTestMessage);
    console.log(`   ⚡ Time: ${response2.response_time_ms}ms, From cache: ${response2.from_cache}`);
    console.log(`   Speed improvement: ${Math.round((response1.response_time_ms / response2.response_time_ms) * 100)}%\n`);
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  console.log('✅ Examples completed!\n');
  console.log('💡 Tips:');
  console.log('   - Use task_type and budget for automatic model selection');
  console.log('   - Lower temperature (0.3) for deterministic tasks like code');
  console.log('   - Higher temperature (0.9) for creative tasks');
  console.log('   - Enable caching for repeated queries');
  console.log('   - Automatic fallback happens if preferred provider fails');
}

runExamples().catch(err => {
  console.error('\n💥 Error:', err.message);
  process.exit(1);
});
