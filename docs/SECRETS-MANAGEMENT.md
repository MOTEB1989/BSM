# 🔐 دليل إدارة الأسرار والمفاتيح
# Secrets Management Guide - BSM Platform

## 📋 جدول المحتويات | Table of Contents

1. [نظرة عامة](#overview)
2. [أفضل الممارسات](#best-practices)
3. [تخزين الأسرار](#storing-secrets)
4. [تدوير المفاتيح](#key-rotation)
5. [الاستخدام في التطوير](#development-usage)
6. [الاستخدام في الإنتاج](#production-usage)
7. [أمثلة عملية](#examples)
8. [استكشاف الأخطاء](#troubleshooting)

---

## 🎯 نظرة عامة | Overview

هذا الدليل يوضح كيفية إدارة الأسرار والمفاتيح بشكل آمن في منصة BSM.

### مبادئ أساسية:
1. ❌ **لا تضع أسرار في الكود أبداً**
2. ✅ استخدم متغيرات البيئة
3. ✅ استخدم Key Management Systems في الإنتاج
4. ✅ دوّر المفاتيح بانتظام
5. ✅ استخدم أذونات محدودة (Least Privilege)

---

## 🛡️ أفضل الممارسات | Best Practices

### 1. تخزين الأسرار

#### ❌ ممنوع:
```javascript
// ❌ NEVER DO THIS!
const apiKey = "sk-abc123xyz789...";

// ❌ NEVER DO THIS!
const config = {
  openaiKey: "sk-abc123xyz789...",
  adminPassword: "admin123"
};

// ❌ NEVER DO THIS!
fetch('https://api.openai.com', {
  headers: { 'Authorization': 'Bearer sk-abc123xyz789...' }
});
```

#### ✅ مسموح:
```javascript
// ✅ Use environment variables
const apiKey = process.env.OPENAI_API_KEY;

// ✅ Use configuration module
import { models } from './config/models.js';
const apiKey = models.openai.bsm;

// ✅ Use secrets manager (production)
import { secretsManager } from './config/secrets.js';
const apiKey = await secretsManager.getSecret('OPENAI_API_KEY');
```

---

### 2. ملفات البيئة

#### بنية الملفات:
```
.env                  # ⚠️ يحتوي على أسرار حقيقية - في .gitignore
.env.example          # ✅ نموذج بدون أسرار - يُتتبع في Git
.env.local            # ⚠️ أسرار محلية - في .gitignore
.env.production       # ❌ لا تستخدم - استخدم Key Management بدلاً منه
```

#### محتوى .env.example:
```bash
# .env.example
# Copy this file to .env and fill in your actual values

# Node Environment
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# OpenAI API Keys
# Get your keys from: https://platform.openai.com/api-keys
OPENAI_BSM_KEY=           # ⚠️ Required - BSM service key
OPENAI_BRINDER_KEY=       # Optional - Brinder service key
OPENAI_LEXNEXUS_KEY=      # Optional - LexNexus service key
OPENAI_MODEL=gpt-4o-mini

# Admin Authentication
# Generate strong token: openssl rand -base64 32
ADMIN_TOKEN=              # ⚠️ Required - Min 16 chars in production

# CORS Configuration
CORS_ORIGINS=https://lexdo.uk,https://www.lexdo.uk

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100

# Agent Configuration
MAX_AGENT_INPUT_LENGTH=4000
```

#### محتوى .env (مثال - لا تشارك):
```bash
# .env
# ⚠️ DO NOT COMMIT THIS FILE!

NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Real API keys (keep secret!)
OPENAI_BSM_KEY=sk-proj-abc123xyz789...
OPENAI_BRINDER_KEY=sk-proj-def456uvw012...
OPENAI_LEXNEXUS_KEY=sk-proj-ghi789rst345...

# Strong admin token (generated with: openssl rand -base64 32)
ADMIN_TOKEN=xJ8mK3nP2qR7sT4vW9yA1bC5dE6fG8h

CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

---

### 3. .gitignore الأساسي

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production

# Secrets and keys
*.key
*.pem
*.p12
*.pfx
*.secret
docker-secrets.env

# Certificates
certs/
certificates/
ssl/
*.crt
*.cer

# Configuration files with secrets
config.secret.js
secrets.json

# Backup files that may contain secrets
*.backup
*.bak
*.old

# Database files
*.sqlite
*.db

# Reports (may contain sensitive info)
reports/

# Dependencies
node_modules/

# OS files
.DS_Store
Thumbs.db
```

---

## 🔑 تخزين الأسرار | Storing Secrets

### خيار 1: متغيرات البيئة (Development)

**الإيجابيات:**
- ✅ سهل الإعداد
- ✅ مناسب للتطوير المحلي
- ✅ مدعوم من جميع الأدوات

**السلبيات:**
- ❌ غير مناسب للإنتاج
- ❌ لا يدعم التدوير التلقائي
- ❌ صعوبة مشاركة الأسرار بأمان

**الاستخدام:**
```bash
# Set environment variable
export OPENAI_API_KEY="sk-..."

# Run application
npm start
```

---

### خيار 2: GitHub Secrets (CI/CD)

**الإيجابيات:**
- ✅ آمن للـ CI/CD
- ✅ مدمج مع GitHub Actions
- ✅ مشفر بشكل افتراضي

**السلبيات:**
- ❌ محدود للـ CI/CD فقط
- ❌ لا يدعم التدوير التلقائي

**الإعداد:**
1. انتقل إلى Repository Settings
2. Secrets and variables → Actions
3. New repository secret
4. أضف:
   - `KM_ENDPOINT`
   - `KM_TOKEN`
   - `SNYK_TOKEN`
   - إلخ...

**الاستخدام في Workflow:**
```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      ADMIN_TOKEN: ${{ secrets.ADMIN_TOKEN }}
    steps:
      - run: npm start
```

---

### خيار 3: AWS Secrets Manager (Production) ⭐ موصى به

**الإيجابيات:**
- ✅ تدوير تلقائي للمفاتيح
- ✅ تدقيق كامل (Audit logs)
- ✅ أذونات دقيقة (IAM)
- ✅ تشفير قوي
- ✅ مراقبة وتنبيهات

**السلبيات:**
- ❌ تكلفة إضافية (~$0.40/secret/month)
- ❌ يتطلب إعداد AWS

**التكلفة:**
- $0.40 per secret per month
- $0.05 per 10,000 API calls
- مثال: 10 secrets = $4/month

**التنفيذ:**

#### 1. التثبيت:
```bash
npm install @aws-sdk/client-secrets-manager
```

#### 2. إنشاء SecretsManager class:
```javascript
// src/config/secrets.js
import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  UpdateSecretCommand 
} from "@aws-sdk/client-secrets-manager";

class SecretsManager {
  constructor() {
    this.client = new SecretsManagerClient({ 
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  async getSecret(secretName) {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ 
        SecretId: secretName 
      });
      const response = await this.client.send(command);
      
      let value;
      if (response.SecretString) {
        value = response.SecretString;
      } else {
        // Binary secret
        const buff = Buffer.from(response.SecretBinary, 'base64');
        value = buff.toString('ascii');
      }
      
      // Cache the secret
      this.cache.set(secretName, {
        value,
        timestamp: Date.now()
      });

      return value;
    } catch (error) {
      console.error(`Failed to fetch secret ${secretName}:`, error);
      
      // Fallback to environment variable in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Falling back to env var for ${secretName}`);
        return process.env[secretName];
      }
      
      throw error;
    }
  }

  async updateSecret(secretName, newValue) {
    try {
      const command = new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: newValue
      });
      await this.client.send(command);
      
      // Clear from cache
      this.cache.delete(secretName);
      
      return true;
    } catch (error) {
      console.error(`Failed to update secret ${secretName}:`, error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const secretsManager = new SecretsManager();
```

#### 3. استخدام SecretsManager:
```javascript
// src/config/models.js
import { secretsManager } from './secrets.js';

export const getModels = async () => {
  // In production, fetch from AWS Secrets Manager
  if (process.env.NODE_ENV === 'production') {
    return {
      openai: {
        bsm: await secretsManager.getSecret('BSM_OPENAI_KEY'),
        brinder: await secretsManager.getSecret('BRINDER_OPENAI_KEY'),
        lexnexus: await secretsManager.getSecret('LEXNEXUS_OPENAI_KEY'),
        default: await secretsManager.getSecret('BSM_OPENAI_KEY')
      }
    };
  }
  
  // In development, use environment variables
  return {
    openai: {
      bsm: process.env.OPENAI_BSM_KEY,
      brinder: process.env.OPENAI_BRINDER_KEY,
      lexnexus: process.env.OPENAI_LEXNEXUS_KEY,
      default: process.env.OPENAI_BSM_KEY
    }
  };
};
```

#### 4. إنشاء Secrets في AWS:
```bash
# Create secret
aws secretsmanager create-secret \
  --name BSM_OPENAI_KEY \
  --description "OpenAI API Key for BSM" \
  --secret-string "sk-..."

# Enable automatic rotation (optional)
aws secretsmanager rotate-secret \
  --secret-id BSM_OPENAI_KEY \
  --rotation-lambda-arn arn:aws:lambda:... \
  --rotation-rules AutomaticallyAfterDays=90
```

---

### خيار 4: HashiCorp Vault

**الإيجابيات:**
- ✅ Open source
- ✅ Self-hosted
- ✅ ميزات متقدمة
- ✅ يدعم Dynamic Secrets

**السلبيات:**
- ❌ يتطلب إعداد وصيانة
- ❌ معقد للمشاريع الصغيرة

**التنفيذ الأساسي:**
```javascript
// src/config/vault.js
import vault from "node-vault";

class VaultManager {
  constructor() {
    this.client = vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
      token: process.env.VAULT_TOKEN
    });
  }

  async getSecret(path) {
    try {
      const result = await this.client.read(path);
      return result.data.data; // KV v2 format
    } catch (error) {
      console.error(`Vault error for ${path}:`, error);
      throw error;
    }
  }

  async writeSecret(path, data) {
    try {
      await this.client.write(path, { data });
      return true;
    } catch (error) {
      console.error(`Vault write error for ${path}:`, error);
      throw error;
    }
  }
}

export const vaultManager = new VaultManager();
```

**الاستخدام:**
```javascript
// Get secret from Vault
const secrets = await vaultManager.getSecret('secret/data/bsm/openai');
const apiKey = secrets.api_key;
```

---

## 🔄 تدوير المفاتيح | Key Rotation

### لماذا تدوير المفاتيح؟
1. ✅ تقليل مخاطر التسريب
2. ✅ الامتثال للمعايير الأمنية
3. ✅ الحد من الضرر في حالة الاختراق

### سياسة التدوير الموصى بها:
- **API Keys:** كل 90 يوم
- **Admin Tokens:** كل 60 يوم
- **Database Passwords:** كل 180 يوم
- **SSL Certificates:** قبل انتهاء الصلاحية بـ 30 يوم

### التدوير اليدوي:

#### 1. توليد مفتاح جديد:
```bash
# Generate strong random token
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

#### 2. تحديث المفتاح:
```bash
# Update in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id BSM_OPENAI_KEY \
  --secret-string "sk-new-key-here..."

# Or update .env file
nano .env
# Replace old key with new key
```

#### 3. إعادة تشغيل التطبيق:
```bash
# Development
npm run dev

# Production (with zero downtime)
pm2 reload bsm-api
```

### التدوير التلقائي:

#### سكريبت التدوير:
```javascript
// scripts/rotate-secrets.js
import { secretsManager } from '../src/config/secrets.js';
import crypto from 'crypto';

const generateStrongToken = (length = 32) => {
  return crypto.randomBytes(length).toString('base64url');
};

const rotateSecret = async (secretName, generator) => {
  try {
    // Get current value
    const oldValue = await secretsManager.getSecret(secretName);
    
    // Backup old value (with timestamp)
    const backupName = `${secretName}_BACKUP_${Date.now()}`;
    await secretsManager.updateSecret(backupName, oldValue);
    
    // Generate new value
    const newValue = generator ? generator() : generateStrongToken();
    
    // Update to new value
    await secretsManager.updateSecret(secretName, newValue);
    
    console.log(`✅ Rotated secret: ${secretName}`);
    console.log(`📦 Backup stored as: ${backupName}`);
    
    return { success: true, newValue, backupName };
  } catch (error) {
    console.error(`❌ Failed to rotate ${secretName}:`, error);
    return { success: false, error };
  }
};

// Rotate ADMIN_TOKEN
const rotateAdminToken = async () => {
  return await rotateSecret('ADMIN_TOKEN', () => generateStrongToken(32));
};

// Rotate all secrets
const rotateAll = async () => {
  const secrets = ['ADMIN_TOKEN', 'KM_TOKEN'];
  
  for (const secret of secrets) {
    await rotateSecret(secret);
    // Wait 5 seconds between rotations
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  rotateAll().then(() => {
    console.log('✅ All secrets rotated successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Rotation failed:', error);
    process.exit(1);
  });
}

export { rotateSecret, rotateAdminToken, rotateAll };
```

#### GitHub Action للتدوير التلقائي:
```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Secrets

on:
  schedule:
    - cron: '0 0 1 */3 *'  # Every 3 months on the 1st
  workflow_dispatch:  # Manual trigger

jobs:
  rotate:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      
      - name: Install dependencies
        run: npm ci
      
      - name: Rotate secrets
        env:
          AWS_REGION: ${{ secrets.AWS_REGION }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: node scripts/rotate-secrets.js
      
      - name: Notify team
        if: success()
        run: |
          echo "✅ Secrets rotated successfully"
          # Send notification (Slack, email, etc.)
```

---

## 🔨 الاستخدام في التطوير | Development Usage

### الإعداد الأولي:

#### 1. نسخ ملف المثال:
```bash
cp .env.example .env
```

#### 2. الحصول على API Keys:
```bash
# OpenAI
# 1. Go to https://platform.openai.com/api-keys
# 2. Create new secret key
# 3. Copy the key (starts with sk-)
# 4. Paste in .env file
```

#### 3. توليد Admin Token:
```bash
# Generate strong admin token
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# Copy and paste in .env as ADMIN_TOKEN
```

#### 4. تحديث .env:
```bash
# .env
NODE_ENV=development
OPENAI_BSM_KEY=sk-proj-YOUR_KEY_HERE
ADMIN_TOKEN=YOUR_GENERATED_TOKEN_HERE
```

#### 5. تشغيل التطبيق:
```bash
npm run dev
```

---

## 🚀 الاستخدام في الإنتاج | Production Usage

### 1. باستخدام Docker:

#### docker-compose.yml:
```yaml
version: '3.8'

services:
  bsm-api:
    image: bsm-api:latest
    env_file:
      - .env.production  # ⚠️ Store securely, not in Git
    environment:
      - NODE_ENV=production
      - AWS_REGION=us-east-1
    secrets:
      - openai_key
      - admin_token

secrets:
  openai_key:
    external: true
  admin_token:
    external: true
```

#### إنشاء Docker secrets:
```bash
# Create secrets
echo "sk-..." | docker secret create openai_key -
echo "token..." | docker secret create admin_token -

# Deploy with secrets
docker stack deploy -c docker-compose.yml bsm
```

### 2. باستخدام Kubernetes:

#### secret.yaml:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: bsm-secrets
type: Opaque
data:
  # Base64 encoded values
  openai-key: c2stcHJvai14eHh4eHh4...
  admin-token: eEo4bUszblAycVI3c1Q0...
```

#### إنشاء Secret:
```bash
# From literal
kubectl create secret generic bsm-secrets \
  --from-literal=openai-key='sk-...' \
  --from-literal=admin-token='token...'

# From file
kubectl create secret generic bsm-secrets \
  --from-file=.env.production
```

#### deployment.yaml:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bsm-api
spec:
  template:
    spec:
      containers:
      - name: bsm-api
        image: bsm-api:latest
        env:
        - name: OPENAI_BSM_KEY
          valueFrom:
            secretKeyRef:
              name: bsm-secrets
              key: openai-key
        - name: ADMIN_TOKEN
          valueFrom:
            secretKeyRef:
              name: bsm-secrets
              key: admin-token
```

---

## 📚 أمثلة عملية | Examples

### مثال 1: استخدام API Key بشكل آمن

#### ❌ خطأ:
```javascript
const apiKey = "sk-proj-abc123xyz789...";

fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

#### ✅ صحيح:
```javascript
import { models } from '../config/models.js';

const apiKey = models.openai.bsm;

if (!apiKey) {
  throw new Error('OPENAI_BSM_KEY not configured');
}

fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

### مثال 2: التحقق من Admin Token

#### ❌ خطأ (Timing Attack vulnerable):
```javascript
if (req.headers['x-admin-token'] === process.env.ADMIN_TOKEN) {
  // Allow access
}
```

#### ✅ صحيح (Timing-safe):
```javascript
import crypto from 'crypto';

const timingSafeEqual = (a, b) => {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

if (timingSafeEqual(req.headers['x-admin-token'], process.env.ADMIN_TOKEN)) {
  // Allow access
}
```

### مثال 3: Logging بدون كشف الأسرار

#### ❌ خطأ:
```javascript
logger.info({ apiKey: apiKey }, 'Making API request');
// Log: apiKey: "sk-proj-abc123..."
```

#### ✅ صحيح:
```javascript
const maskSecret = (secret) => {
  if (!secret || secret.length < 8) return '***';
  return secret.slice(0, 4) + '...' + secret.slice(-4);
};

logger.info({ 
  apiKey: maskSecret(apiKey) 
}, 'Making API request');
// Log: apiKey: "sk-p...3xyz"
```

---

## 🔧 استكشاف الأخطاء | Troubleshooting

### خطأ: "ADMIN_TOKEN must be set in production"

**السبب:** لم يتم تعيين ADMIN_TOKEN في بيئة الإنتاج

**الحل:**
```bash
# Set environment variable
export ADMIN_TOKEN="your-strong-token-here"

# Or in .env file
echo "ADMIN_TOKEN=your-strong-token-here" >> .env

# Verify
echo $ADMIN_TOKEN
```

### خطأ: "Missing API key for model provider"

**السبب:** لم يتم تعيين OPENAI_BSM_KEY

**الحل:**
```bash
# Check if key is set
echo $OPENAI_BSM_KEY

# Set the key
export OPENAI_BSM_KEY="sk-proj-your-key-here"

# Or in .env
echo "OPENAI_BSM_KEY=sk-proj-your-key-here" >> .env
```

### خطأ: "Failed to fetch secret from AWS Secrets Manager"

**الأسباب المحتملة:**
1. AWS credentials غير صحيحة
2. Region غير صحيح
3. Secret name غير موجود
4. Permissions غير كافية

**الحل:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check if secret exists
aws secretsmanager describe-secret --secret-id BSM_OPENAI_KEY

# Check permissions
aws secretsmanager get-secret-value --secret-id BSM_OPENAI_KEY

# Update IAM policy if needed
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:BSM_*"
    }
  ]
}
```

---

## 🛡️ قائمة التحقق الأمنية | Security Checklist

قبل نشر التطبيق، تأكد من:

- [ ] لا توجد أسرار في الكود
- [ ] ملف .env في .gitignore
- [ ] .env.example لا يحتوي على أسرار حقيقية
- [ ] ADMIN_TOKEN قوي (16+ حرف)
- [ ] API Keys صالحة ومحدثة
- [ ] تم تفعيل Secret Scanning
- [ ] تم تفعيل Key Rotation policy
- [ ] تم اختبار التطبيق بدون أسرار في الكود
- [ ] تم توثيق جميع الأسرار المطلوبة
- [ ] تم تقييد الأذونات (Least Privilege)

---

## 📞 الدعم | Support

إذا واجهت مشاكل في إدارة الأسرار:
1. راجع هذا الدليل
2. افتح Issue على GitHub
3. اتصل بفريق الأمان

---

**آخر تحديث:** 2025-02-06  
**الإصدار:** 1.0
