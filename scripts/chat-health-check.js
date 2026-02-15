#!/usr/bin/env node

/**
 * Chat Health Check Script
 * 
 * This script checks the health of the chat system and diagnoses common issues.
 * 
 * Usage:
 *   node scripts/chat-health-check.js [URL]
 * 
 * Example:
 *   node scripts/chat-health-check.js https://sr-bsm.onrender.com
 */

import fetch from 'node-fetch';

const BASE_URL = process.argv[2] || 'http://localhost:3000';

console.log('🔍 BSM Chat Health Check');
console.log('========================\n');
console.log(`Target: ${BASE_URL}\n`);

const checks = [];

async function checkEndpoint(name, url, expectedStatus = 200) {
  try {
    const start = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - start;
    
    const data = await response.json().catch(() => null);
    
    const passed = response.status === expectedStatus;
    checks.push({
      name,
      passed,
      status: response.status,
      duration,
      data
    });
    
    return { passed, status: response.status, data, duration };
  } catch (error) {
    checks.push({
      name,
      passed: false,
      error: error.message
    });
    
    return { passed: false, error: error.message };
  }
}

async function testChatMessage() {
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/chat/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, this is a health check test',
        language: 'en'
      })
    });
    const duration = Date.now() - start;
    
    const data = await response.json();
    
    const passed = response.status === 200 && data.output;
    checks.push({
      name: 'Chat Message',
      passed,
      status: response.status,
      duration,
      data
    });
    
    return { passed, status: response.status, data, duration };
  } catch (error) {
    checks.push({
      name: 'Chat Message',
      passed: false,
      error: error.message
    });
    
    return { passed: false, error: error.message };
  }
}

async function runChecks() {
  // Check 1: Service Health
  console.log('1️⃣  Checking service health...');
  const health = await checkEndpoint('Service Health', `${BASE_URL}/health`);
  if (health.passed) {
    console.log('   ✅ Service is running');
  } else {
    console.log(`   ❌ Service health check failed: ${health.error || `HTTP ${health.status}`}`);
  }
  console.log();
  
  // Check 2: API Health
  console.log('2️⃣  Checking API health...');
  const apiHealth = await checkEndpoint('API Health', `${BASE_URL}/api/health`);
  if (apiHealth.passed) {
    console.log('   ✅ API is responding');
  } else {
    console.log(`   ❌ API health check failed: ${apiHealth.error || `HTTP ${apiHealth.status}`}`);
  }
  console.log();
  
  // Check 3: Key Status
  console.log('3️⃣  Checking AI key status...');
  const keyStatus = await checkEndpoint('Key Status', `${BASE_URL}/api/chat/key-status`);
  if (keyStatus.passed) {
    console.log('   ✅ Key status endpoint accessible');
    if (keyStatus.data?.status?.openai) {
      console.log('   ✅ OpenAI API key is configured');
    } else {
      console.log('   ⚠️  OpenAI API key is NOT configured');
      console.log('   → Please set OPENAI_BSM_KEY, OPENAI_BSU_KEY, or OPENAI_API_KEY');
    }
    if (keyStatus.data?.ui) {
      console.log('\n   Provider Status:');
      for (const [provider, status] of Object.entries(keyStatus.data.ui)) {
        console.log(`   - ${provider}: ${status}`);
      }
    }
  } else {
    console.log(`   ❌ Key status check failed: ${keyStatus.error || `HTTP ${keyStatus.status}`}`);
  }
  console.log();
  
  // Check 4: Chat Message Test
  console.log('4️⃣  Testing chat message...');
  const chatTest = await testChatMessage();
  if (chatTest.passed) {
    console.log('   ✅ Chat message successful');
    console.log(`   Duration: ${chatTest.duration}ms`);
    if (chatTest.data?.output) {
      const preview = chatTest.data.output.substring(0, 100);
      console.log(`   Response preview: "${preview}${chatTest.data.output.length > 100 ? '...' : ''}"`);
    }
  } else {
    console.log(`   ❌ Chat message failed`);
    if (chatTest.error) {
      console.log(`   Error: ${chatTest.error}`);
      if (chatTest.error.includes('ENOTFOUND') || chatTest.error.includes('fetch')) {
        console.log('   → This is a network connectivity issue');
        console.log('   → Check DNS resolution and network access to api.openai.com');
      }
    } else if (chatTest.data?.code) {
      console.log(`   Error code: ${chatTest.data.code}`);
      console.log(`   Error message: ${chatTest.data.error}`);
      
      if (chatTest.data.code === 'MISSING_API_KEY') {
        console.log('   → OpenAI API key is not configured');
        console.log('   → Set OPENAI_BSM_KEY, OPENAI_BSU_KEY, or OPENAI_API_KEY');
      } else if (chatTest.data.code === 'NETWORK_ERROR') {
        console.log('   → Cannot connect to OpenAI API');
        console.log('   → Check network connectivity and DNS resolution');
      } else if (chatTest.data.code === 'GPT_TIMEOUT') {
        console.log('   → Request timed out (>30s)');
        console.log('   → Check OpenAI API status or network latency');
      }
    }
  }
  console.log();
  
  // Summary
  console.log('\n📊 Summary');
  console.log('==========\n');
  
  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  
  console.log(`Total checks: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  
  if (passed === total) {
    console.log('\n✅ All checks passed! Chat should be working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some checks failed. Review the errors above for details.');
    console.log('\n💡 Tips:');
    console.log('   - Check environment variables on Render dashboard');
    console.log('   - Verify OpenAI API key is valid');
    console.log('   - Check server logs for detailed error messages');
    console.log('   - See CHAT-TROUBLESHOOTING.md for more help');
    process.exit(1);
  }
}

runChecks().catch(err => {
  console.error('\n❌ Unexpected error:', err.message);
  process.exit(1);
});
