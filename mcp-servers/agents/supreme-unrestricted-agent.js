/**
 * ⚠️⚠️⚠️ SUPREME UNRESTRICTED MASTER AGENT ⚠️⚠️⚠️
 * 
 * 🔴 EXTREME DANGER - UNRESTRICTED SYSTEM ACCESS 🔴
 * 
 * This agent has MAXIMUM PRIVILEGES including:
 * - Arbitrary shell command execution
 * - Unrestricted internet access
 * - Automatic code modification
 * - File system manipulation
 * - No security boundaries
 * 
 * ⚠️ WARNING: FOR PERSONAL/TEST ENVIRONMENTS ONLY ⚠️
 * 
 * DO NOT USE IN:
 * - Production environments
 * - Client systems
 * - Shared hosting
 * - Any system with real data or users
 * - Public-facing servers
 * 
 * This agent bypasses ALL BSM security controls including:
 * - Action whitelisting
 * - Approval workflows
 * - Circuit breakers
 * - Rate limiting
 * - Egress policies
 * 
 * USE AT YOUR OWN RISK!
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../src/utils/logger.js';

export class SupremeUnrestrictedAgent {
  constructor(config = {}) {
    this.config = config;
    this.name = 'SupremeUnrestrictedAgent';
    this.id = 'supreme-unrestricted-agent';
    this.role = 'master';
    this.enabled = false;
    this.dryRun = config.dryRun !== false; // Default to dry-run for safety
    this.auditLog = [];
    
    // Security check: Verify environment variable
    this.enabled = process.env.SUPREME_AGENT_ENABLED === 'true';
    
    if (!this.enabled) {
      logger.warn(
        '⚠️ Supreme Unrestricted Agent is DISABLED. ' +
        'Set SUPREME_AGENT_ENABLED=true to enable (NOT RECOMMENDED IN PRODUCTION)'
      );
    }
    
    if (process.env.NODE_ENV === 'production' && this.enabled) {
      logger.error(
        '🔴 CRITICAL: Supreme Unrestricted Agent is ENABLED in PRODUCTION! ' +
        'This is extremely dangerous and NOT RECOMMENDED!'
      );
    }
    
    logger.info(`[${this.name}] Initialized`, {
      enabled: this.enabled,
      dryRun: this.dryRun,
      environment: process.env.NODE_ENV,
      role: this.role
    });
  }

  /**
   * Check if agent is enabled
   * @private
   */
  _checkEnabled() {
    if (!this.enabled) {
      throw new Error(
        'Supreme Unrestricted Agent is disabled. ' +
        'Set SUPREME_AGENT_ENABLED=true to enable (USE WITH EXTREME CAUTION)'
      );
    }
  }

  /**
   * Add entry to audit log
   * @private
   */
  _audit(action, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      dryRun: this.dryRun
    };
    this.auditLog.push(entry);
    logger.info(`[${this.name}] AUDIT:`, entry);
  }

  /**
   * Sanitize shell command (basic validation)
   * @private
   */
  _sanitizeCommand(command) {
    // Basic sanitization - block extremely dangerous patterns
    const dangerous = [
      'rm -rf /',
      'rm -rf ~',
      'mkfs',
      ':(){:|:&};:',  // fork bomb
      'dd if=/dev/zero',
      '> /dev/sda'
    ];
    
    const lower = command.toLowerCase();
    for (const pattern of dangerous) {
      if (lower.includes(pattern.toLowerCase())) {
        throw new Error(`Dangerous command detected and blocked: ${pattern}`);
      }
    }
    
    return command;
  }

  /**
   * Execute shell command
   * ⚠️ DANGER: Executes arbitrary commands
   * 
   * @param {string} command - Shell command to execute
   * @param {object} options - Execution options
   * @returns {string} Command output
   */
  execShell(command, options = {}) {
    this._checkEnabled();
    this._audit('execShell', { command, options });
    
    // Sanitize command
    const sanitized = this._sanitizeCommand(command);
    
    console.log(`[${this.name}] 🔨 Running shell:`, sanitized);
    
    if (this.dryRun) {
      console.log(`[${this.name}] 🔵 DRY-RUN MODE: Command would execute but was skipped`);
      return '[DRY-RUN] Command execution skipped';
    }
    
    try {
      const output = execSync(sanitized, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      
      this._audit('execShell_success', { command: sanitized, outputLength: output?.length || 0 });
      return output;
    } catch (error) {
      this._audit('execShell_error', { command: sanitized, error: error.message });
      logger.error(`[${this.name}] Shell command failed:`, error);
      throw error;
    }
  }

  /**
   * Fetch web content
   * ⚠️ DANGER: No URL restrictions
   * 
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async fetchWeb(url, options = {}) {
    this._checkEnabled();
    this._audit('fetchWeb', { url, options });
    
    console.log(`[${this.name}] 🌐 Fetching:`, url);
    
    if (this.dryRun) {
      console.log(`[${this.name}] 🔵 DRY-RUN MODE: Fetch would execute but was skipped`);
      return { dryRun: true, url };
    }
    
    try {
      // Use dynamic import for node-fetch in ES modules
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(url, {
        timeout: 10000,
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.text();
      this._audit('fetchWeb_success', { url, statusCode: response.status, dataLength: data.length });
      
      return data;
    } catch (error) {
      this._audit('fetchWeb_error', { url, error: error.message });
      logger.error(`[${this.name}] Web fetch failed:`, error);
      throw error;
    }
  }

  /**
   * Audit and fix all JavaScript files
   * ⚠️ DANGER: Automatically modifies code files
   * 
   * @param {string} targetDir - Directory to scan (defaults to cwd)
   * @returns {Promise<object>} Audit results
   */
  async auditAndFixFiles(targetDir = process.cwd()) {
    this._checkEnabled();
    this._audit('auditAndFixFiles', { targetDir });
    
    console.log(`[${this.name}] 🔍 Auditing files in:`, targetDir);
    
    const results = {
      scanned: 0,
      modified: 0,
      errors: 0,
      files: []
    };
    
    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const jsFiles = entries
        .filter(e => e.isFile() && e.name.endsWith('.js'))
        .map(e => e.name);
      
      for (const file of jsFiles) {
        results.scanned++;
        const filePath = path.join(targetDir, file);
        
        try {
          let code = await fs.readFile(filePath, 'utf8');
          
          // Example fixes:
          // 1. Remove console.log statements (be careful with this!)
          const consoleLogCount = (code.match(/console\.log\(.*?\);?/g) || []).length;
          
          if (consoleLogCount > 0) {
            console.log(`[${this.name}]   📄 ${file}: Found ${consoleLogCount} console.log statements`);
            
            if (!this.dryRun) {
              // Remove console.log statements
              code = code.replace(/console\.log\(.*?\);?/g, '');
              await fs.writeFile(filePath, code, 'utf8');
              results.modified++;
              console.log(`[${this.name}]   ✅ ${file}: Removed console.log statements`);
            } else {
              console.log(`[${this.name}]   🔵 DRY-RUN: Would remove console.log from ${file}`);
            }
            
            results.files.push({
              file,
              changes: { consoleLogRemoved: consoleLogCount },
              modified: !this.dryRun
            });
          }
        } catch (error) {
          results.errors++;
          logger.error(`[${this.name}] Error processing ${file}:`, error);
        }
      }
      
      this._audit('auditAndFixFiles_complete', results);
      
      console.log(`[${this.name}] ✅ Audit complete:`, {
        scanned: results.scanned,
        modified: results.modified,
        errors: results.errors,
        dryRun: this.dryRun
      });
      
      return results;
    } catch (error) {
      this._audit('auditAndFixFiles_error', { error: error.message });
      logger.error(`[${this.name}] Audit failed:`, error);
      throw error;
    }
  }

  /**
   * Full health check with automated fixes
   * ⚠️ DANGER: Runs multiple system commands
   * 
   * @returns {Promise<object>} Health check results
   */
  async fullHealthCheck() {
    this._checkEnabled();
    this._audit('fullHealthCheck', { timestamp: new Date().toISOString() });
    
    console.log(`[${this.name}] 🏥 Starting full health check...`);
    
    const results = {
      npmAudit: null,
      eslint: null,
      tests: null,
      fileAudit: null,
      timestamp: new Date().toISOString()
    };
    
    try {
      // 1. npm audit
      console.log(`[${this.name}] --- Running npm audit ---`);
      try {
        results.npmAudit = this.execShell('npm audit --fix || true', { silent: true });
      } catch (error) {
        results.npmAudit = { error: error.message };
      }
      
      // 2. ESLint
      console.log(`[${this.name}] --- Running ESLint ---`);
      try {
        results.eslint = this.execShell('npx eslint . --fix || true', { silent: true });
      } catch (error) {
        results.eslint = { error: error.message };
      }
      
      // 3. File audit
      console.log(`[${this.name}] --- Auditing files ---`);
      results.fileAudit = await this.auditAndFixFiles();
      
      // 4. Run tests
      console.log(`[${this.name}] --- Running tests ---`);
      try {
        results.tests = this.execShell('npm test || true', { silent: true });
      } catch (error) {
        results.tests = { error: error.message };
      }
      
      this._audit('fullHealthCheck_complete', results);
      console.log(`[${this.name}] ✅ Health check complete`);
      
      return results;
    } catch (error) {
      this._audit('fullHealthCheck_error', { error: error.message });
      logger.error(`[${this.name}] Health check failed:`, error);
      throw error;
    }
  }

  /**
   * Supreme Sweep - Complete maintenance cycle
   * ⚠️ DANGER: Runs all automated operations
   * 
   * @returns {Promise<object>} Sweep results
   */
  async supremeSweep() {
    this._checkEnabled();
    this._audit('supremeSweep_start', { timestamp: new Date().toISOString() });
    
    console.log(`[${this.name}] 🧹 SUPREME SWEEP INITIATED`);
    console.log(`[${this.name}] Mode: ${this.dryRun ? '🔵 DRY-RUN' : '🔴 LIVE'}`);
    
    if (!this.dryRun) {
      console.log(`[${this.name}] ⚠️ WARNING: Running in LIVE mode - changes WILL be made!`);
    }
    
    const results = {
      healthCheck: null,
      gitStatus: null,
      auditLog: [],
      timestamp: new Date().toISOString()
    };
    
    try {
      // Run full health check
      results.healthCheck = await this.fullHealthCheck();
      
      // Check git status
      console.log(`[${this.name}] --- Checking git status ---`);
      try {
        results.gitStatus = this.execShell('git --no-pager status', { silent: true });
      } catch (error) {
        results.gitStatus = { error: error.message };
      }
      
      // Copy audit log
      results.auditLog = [...this.auditLog];
      
      this._audit('supremeSweep_complete', { summary: 'All operations completed' });
      
      console.log(`[${this.name}] ✅ SUPREME SWEEP COMPLETE`);
      console.log(`[${this.name}] Total operations: ${this.auditLog.length}`);
      
      return results;
    } catch (error) {
      this._audit('supremeSweep_error', { error: error.message });
      logger.error(`[${this.name}] Supreme sweep failed:`, error);
      throw error;
    }
  }

  /**
   * Get audit log
   * @returns {Array} Audit log entries
   */
  getAuditLog() {
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog() {
    this.auditLog = [];
    console.log(`[${this.name}] Audit log cleared`);
  }

  /**
   * Get agent status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      enabled: this.enabled,
      dryRun: this.dryRun,
      environment: process.env.NODE_ENV,
      auditLogSize: this.auditLog.length,
      securityWarning: this.enabled ? 'AGENT IS ACTIVE - UNRESTRICTED ACCESS' : 'Agent is disabled'
    };
  }
}

export default SupremeUnrestrictedAgent;
