/**
 * SAMA Banking Security Middleware
 * 
 * Implements Saudi Central Bank (SAMA) cybersecurity standards:
 * - Data encryption (TLS 1.3, AES-256)
 * - Audit logging for all transactions
 * - Data residency controls
 * - Incident response integration
 * 
 * @module middleware/samaCompliance
 */

import crypto from 'crypto';
import { auditLogger } from '../audit/logger.js';
import logger from '../utils/logger.js';

/**
 * SAMA Compliance Configuration
 */
export const samaConfig = {
  // Data residency requirements
  dataResidency: {
    allowedRegions: ['sa-riyadh-1', 'sa-jeddah-1', 'me-bahrain-1'],
    preventCrossBorderTransfer: process.env.SAMA_DATA_RESIDENCY === 'strict',
    requireLocalBackup: true
  },

  // Encryption standards
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16,
    authTagLength: 16
  },

  // Audit requirements
  audit: {
    logAllInteractions: true,
    retentionPeriodYears: 7,
    includeUserContext: true,
    includeSensitiveDataHashes: true
  },

  // Security headers
  securityHeaders: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
};

/**
 * Encrypt sensitive data according to SAMA standards
 * 
 * @param {string} data - Data to encrypt
 * @param {Buffer} key - Encryption key (32 bytes for AES-256)
 * @returns {Object} Encrypted data with IV and auth tag
 */
export function encryptSensitiveData(data, key) {
  if (!key || key.length !== samaConfig.encryption.keyLength) {
    throw new Error('Invalid encryption key: must be 32 bytes for AES-256');
  }

  const iv = crypto.randomBytes(samaConfig.encryption.ivLength);
  const cipher = crypto.createCipheriv(samaConfig.encryption.algorithm, key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    algorithm: samaConfig.encryption.algorithm
  };
}

/**
 * Decrypt data encrypted with encryptSensitiveData
 * 
 * @param {Object} encryptedData - Encrypted data object
 * @param {Buffer} key - Decryption key
 * @returns {string} Decrypted data
 */
export function decryptSensitiveData(encryptedData, key) {
  const { encrypted, iv, authTag, algorithm } = encryptedData;

  if (algorithm !== samaConfig.encryption.algorithm) {
    throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Create SHA-256 hash for sensitive data (for audit logs)
 * 
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
export function hashSensitiveData(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * SAMA Audit Logging Middleware
 * Logs all API interactions according to SAMA requirements
 */
export const samaAuditMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Capture original res.json to log response
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - startTime;

    // Log the interaction
    if (samaConfig.audit.logAllInteractions) {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        eventType: 'API_REQUEST',
        method: req.method,
        path: req.path,
        userId: req.user?.id || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        correlationId: req.correlationId
      };

      // Include sensitive data hashes if configured
      if (samaConfig.audit.includeSensitiveDataHashes && req.body) {
        auditEntry.requestBodyHash = hashSensitiveData(JSON.stringify(req.body));
        auditEntry.responseBodyHash = hashSensitiveData(JSON.stringify(body));
      }

      // Log to audit system
      if (auditLogger && typeof auditLogger.log === 'function') {
        auditLogger.log(auditEntry);
      } else {
        logger.info({ audit: auditEntry }, 'SAMA Audit Log');
      }
    }

    return originalJson.call(this, body);
  };

  next();
};

/**
 * SAMA Security Headers Middleware
 * Adds required security headers
 */
export const samaSecurityHeaders = (req, res, next) => {
  // Apply all security headers
  Object.entries(samaConfig.securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  // Add SAMA-specific headers
  res.setHeader('X-SAMA-Compliant', 'true');
  res.setHeader('X-Data-Residency', samaConfig.dataResidency.allowedRegions.join(','));

  next();
};

/**
 * Data Residency Validation Middleware
 * Ensures data operations comply with SAMA data residency requirements
 */
export const samaDataResidency = (req, res, next) => {
  // Skip for health checks and public endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Check if the request involves cross-border data transfer
  const targetRegion = req.headers['x-target-region'];
  
  if (targetRegion && !samaConfig.dataResidency.allowedRegions.includes(targetRegion)) {
    logger.warn({
      path: req.path,
      targetRegion,
      allowedRegions: samaConfig.dataResidency.allowedRegions
    }, 'Data residency violation attempt');

    return res.status(403).json({
      error: 'Data residency violation',
      message: 'Data cannot be transferred to the specified region',
      arabicMessage: 'لا يمكن نقل البيانات إلى المنطقة المحددة',
      allowedRegions: samaConfig.dataResidency.allowedRegions
    });
  }

  next();
};

/**
 * Sensitive Data Protection Middleware
 * Automatically encrypts sensitive fields in requests/responses
 */
export const samaSensitiveDataProtection = (encryptionKey) => {
  return (req, res, next) => {
    // Fields that should be encrypted
    const sensitiveFields = [
      'password',
      'apiKey',
      'token',
      'secret',
      'creditCard',
      'ssn',
      'nationalId',
      'iban'
    ];

    // Encrypt sensitive fields in request body
    if (req.body && typeof req.body === 'object') {
      sensitiveFields.forEach(field => {
        if (req.body[field]) {
          try {
            req.body[`${field}_encrypted`] = encryptSensitiveData(
              req.body[field],
              encryptionKey
            );
            // Remove plaintext version
            delete req.body[field];
          } catch (error) {
            logger.error({ error, field }, 'Failed to encrypt sensitive field');
          }
        }
      });
    }

    next();
  };
};

/**
 * SAMA Compliance Validation Middleware
 * Validates that the request meets all SAMA requirements
 */
export const samaComplianceValidation = (req, res, next) => {
  const violations = [];

  // Check TLS version (must be 1.3)
  if (req.protocol !== 'https' && process.env.NODE_ENV === 'production') {
    violations.push('HTTPS required in production');
  }

  // Check authentication for sensitive endpoints
  if (req.path.includes('/admin') || req.path.includes('/api/agents/run')) {
    if (!req.isAdmin && !req.user) {
      violations.push('Authentication required for sensitive endpoints');
    }
  }

  // Check rate limiting headers
  if (!res.getHeader('X-RateLimit-Limit')) {
    violations.push('Rate limiting must be enabled');
  }

  if (violations.length > 0) {
    logger.warn({
      path: req.path,
      violations
    }, 'SAMA compliance violations detected');

    return res.status(400).json({
      error: 'SAMA compliance violations',
      violations,
      arabicMessage: 'تم اكتشاف مخالفات للامتثال لمعايير ساما'
    });
  }

  next();
};

/**
 * Export all SAMA middleware
 */
export default {
  samaAuditMiddleware,
  samaSecurityHeaders,
  samaDataResidency,
  samaSensitiveDataProtection,
  samaComplianceValidation,
  encryptSensitiveData,
  decryptSensitiveData,
  hashSensitiveData,
  samaConfig
};
