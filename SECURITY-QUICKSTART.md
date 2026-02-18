# 🚀 دليل البداية السريعة للأمان
# Security Quick Start Guide

## ⚡ إعداد سريع (5 دقائق)

### 1. نسخ ملف البيئة
```bash
cp .env.example .env
```

### 2. توليد Admin Token قوي
```bash
# Generate strong token
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 3. تحديث .env
```bash
nano .env

# Update these lines:
OPENAI_BSM_KEY=sk-proj-YOUR_KEY_HERE
ADMIN_TOKEN=YOUR_GENERATED_TOKEN_HERE
```

### 4. تشغيل Secret Scanning (محلياً)
```bash
# Install Gitleaks
brew install gitleaks  # macOS
# or
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.2/gitleaks_8.18.2_linux_x64.tar.gz
tar xvzf gitleaks_*.tar.gz

# Run scan
gitleaks detect --source . --verbose
```

### 5. التحقق من الأمان
```bash
# Check no secrets in code
grep -r "sk-" src/ --exclude-dir=node_modules

# Check .env not tracked
git status .env  # Should show: fatal: pathspec '.env' did not match any files

# Run npm audit
npm audit
```

---

## ⚠️ قواعد أساسية (يجب حفظها)

### ❌ لا تفعل أبداً:
1. لا تضع مفاتيح API مباشرة في الكود
2. لا تشارك ملف .env في Git
3. لا تستخدم "admin" أو "password" كلمات مرور
4. لا تعرض قيم الأسرار في الـ logs
5. لا تنسخ مفاتيح في رسائل Slack/Email

### ✅ افعل دائماً:
1. استخدم متغيرات البيئة
2. دوّر المفاتيح كل 90 يوم
3. استخدم كلمات مرور قوية (16+ حرف)
4. فعّل Secret Scanning
5. راجع الأذونات بانتظام

---

## 🔑 مولدات كلمات المرور

### Strong Token (32 chars)
```bash
openssl rand -base64 32
```

### API Key Style (40 chars)
```bash
openssl rand -hex 20
```

### UUID
```bash
uuidgen
```

### Custom Length
```bash
openssl rand -base64 48 | tr -d "=+/" | cut -c1-32
```

---

## 🛡️ فحص سريع للأمان

```bash
# 1. No secrets in code
! grep -r "sk-[a-zA-Z0-9]" src/ --exclude-dir=node_modules

# 2. .env is ignored
! git ls-files | grep "^\.env$"

# 3. No vulnerabilities
npm audit --audit-level=high

# 4. Strong ADMIN_TOKEN
[ ${#ADMIN_TOKEN} -ge 16 ]

# 5. Run all checks
npm run validate
```

---

## 📋 قائمة التحقق اليومية

- [ ] لم أضف أسرار في الكود اليوم
- [ ] راجعت ملفات .env قبل الـ commit
- [ ] فحصت npm audit
- [ ] لم أشارك مفاتيح في القنوات العامة

---

## 🚨 في حالة تسريب مفتاح

### ⚡ إجراءات فورية (خلال 5 دقائق):

1. **أوقف المفتاح فوراً:**
```bash
# OpenAI: https://platform.openai.com/api-keys
# AWS: aws iam delete-access-key --access-key-id AKIA...
```

2. **أنشئ مفتاح جديد:**
```bash
# Generate new key
openssl rand -base64 32
```

3. **حدّث المفتاح في جميع الأماكن:**
```bash
# Update .env
nano .env

# Update AWS Secrets Manager
aws secretsmanager update-secret --secret-id BSM_OPENAI_KEY --secret-string "new-key"

# Update GitHub Secrets
# Go to: Settings → Secrets → Update
```

4. **احذف المفتاح من Git history:**
```bash
# Using BFG Repo-Cleaner (recommended)
brew install bfg
bfg --replace-text passwords.txt

# Or using git-filter-repo
git filter-repo --path .env --invert-paths --force

# Force push (⚠️ WARNING: destructive)
git push origin --force --all
```

5. **أبلغ الفريق:**
```text
🚨 SECURITY ALERT: API key compromised and rotated
- Affected service: [service name]
- Action taken: Key revoked and replaced
- Impact: None expected
- Next steps: Monitor for unusual activity
```

---

## 📚 موارد إضافية

- [SECRETS-MANAGEMENT.md](./SECRETS-MANAGEMENT.md) - دليل شامل
- [SECURITY-AUDIT.md](../reports/SECURITY-AUDIT.md) - تقرير الأمان
- [.gitleaks.toml](../.gitleaks.toml) - قواعد فحص الأسرار

---

## 💡 نصائح سريعة

### VS Code: منع كتابة أسرار
أضف إلى `.vscode/settings.json`:
```json
{
  "files.watcherExclude": {
    "**/.env": true
  },
  "search.exclude": {
    "**/.env": true
  }
}
```

### Git Hooks: Pre-commit check
أضف إلى `.git/hooks/pre-commit`:
```bash
#!/bin/bash
if git diff --cached --name-only | grep -q "^\.env$"; then
  echo "❌ Error: Attempting to commit .env file!"
  exit 1
fi

if gitleaks detect --staged --verbose; then
  echo "✅ No secrets detected"
else
  echo "❌ Secrets detected! Commit blocked."
  exit 1
fi
```

### Bash Alias: Quick security check
أضف إلى `~/.bashrc`:
```bash
alias sec-check='npm audit && gitleaks detect --source . --verbose'
alias new-token='openssl rand -base64 32'
```

---

**وقت القراءة:** 2 دقيقة  
**وقت التنفيذ:** 5 دقائق  
**مستوى الأهمية:** 🔴 حرج
