#!/usr/bin/env node

/**
 * Render.yaml Validation Script
 * 
 * Validates the render.yaml configuration file for Render.com deployment
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Validating render.yaml configuration...\n');

// Load render.yaml
const renderYamlPath = join(__dirname, '..', 'render.yaml');
let config;

try {
  const content = readFileSync(renderYamlPath, 'utf8');
  config = parse(content);
} catch (error) {
  console.error('❌ Error reading render.yaml:', error.message);
  process.exit(1);
}

// Validation checks
const errors = [];
const warnings = [];

// Check version
if (!config.version) {
  errors.push('Missing version field');
} else {
  console.log('✅ Version:', config.version);
}

// Check services
if (!config.services || !Array.isArray(config.services)) {
  errors.push('Missing or invalid services array');
} else {
  console.log('✅ Services count:', config.services.length);
  
  config.services.forEach((service, index) => {
    console.log(`\nValidating service ${index + 1}:`);
    
    // Required fields
    const requiredFields = ['type', 'name', 'runtime', 'buildCommand', 'startCommand'];
    requiredFields.forEach(field => {
      if (!service[field]) {
        errors.push(`Service ${index + 1}: Missing required field '${field}'`);
      } else {
        console.log(`  ✅ ${field}: ${service[field]}`);
      }
    });
    
    // Optional but important fields
    if (service.repo) {
      console.log(`  ✅ repo: ${service.repo}`);
    } else {
      warnings.push(`Service ${index + 1}: No repository URL specified`);
    }
    
    if (service.region) {
      console.log(`  ✅ region: ${service.region}`);
    } else {
      warnings.push(`Service ${index + 1}: No region specified (will use default)`);
    }
    
    // Environment variables
    if (service.envVars && Array.isArray(service.envVars)) {
      console.log(`  ✅ Environment variables: ${service.envVars.length} configured`);
      
      // Check required environment variables
      const requiredEnvVars = ['NODE_ENV', 'ADMIN_TOKEN', 'CORS_ORIGINS'];
      const configuredKeys = service.envVars.map(ev => ev.key);
      
      requiredEnvVars.forEach(requiredKey => {
        if (!configuredKeys.includes(requiredKey)) {
          warnings.push(`Service ${index + 1}: Missing recommended env var '${requiredKey}'`);
        }
      });
      
      // Check AI provider keys
      const hasOpenAI = configuredKeys.includes('OPENAI_BSM_KEY') || 
                       configuredKeys.includes('OPENAI_API_KEY');
      if (!hasOpenAI) {
        warnings.push(`Service ${index + 1}: No OpenAI API key configured`);
      }
      
      // Verify sync: false for security
      service.envVars.forEach(envVar => {
        if (envVar.sync !== false) {
          warnings.push(`Service ${index + 1}: Environment variable '${envVar.key}' has sync: ${envVar.sync} (should be false for security)`);
        }
      });
    } else {
      warnings.push(`Service ${index + 1}: No environment variables configured`);
    }
    
    // Domains
    if (service.domains && Array.isArray(service.domains)) {
      console.log(`  ✅ Custom domains: ${service.domains.length}`);
      service.domains.forEach(domain => {
        console.log(`    - ${domain}`);
      });
    }
    
    // Auto-deploy
    if (service.autoDeployTrigger) {
      console.log(`  ✅ Auto-deploy: ${service.autoDeployTrigger}`);
      if (service.autoDeployTrigger !== 'off') {
        warnings.push(`Service ${index + 1}: Auto-deploy is enabled (consider 'off' for production control)`);
      }
    }
  });
}

// Print summary
console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ render.yaml is valid with no errors or warnings!');
} else if (errors.length === 0) {
  console.log(`\n✅ render.yaml is valid with ${warnings.length} warning(s)`);
} else {
  console.log(`\n❌ render.yaml has ${errors.length} error(s) and ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log('='.repeat(60));
