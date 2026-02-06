#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/bootstrap_bsm_agents.sh <git-remote> [open-pr]
# Example: ./scripts/bootstrap_bsm_agents.sh origin true
REMOTE=${1:-origin}
OPEN_PR=${2:-true}
TIMESTAMP=$(date +"%Y%m%dT%H%M%S")
BRANCH="bsm-agents-bootstrap-${TIMESTAMP}"
REPORT_DIR="reports"
PR_TITLE="BSM Agents Suggestions - ${TIMESTAMP}"
PR_BODY="This PR contains suggested files and automation for the BSM Agents system. Review before merging."

echo "Starting bootstrap at ${TIMESTAMP}"
echo "Creating branch ${BRANCH}"

# Ensure repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
  echo "Error: run this script from inside a git repository."
  exit 1
fi
cd "$REPO_ROOT"

# Create branch
git checkout -b "${BRANCH}"

# Create directories
mkdir -p .github/agents
mkdir -p .github/PULL_REQUEST_TEMPLATE
mkdir -p .github/workflows
mkdir -p scripts
mkdir -p "${REPORT_DIR}"

# Write agent files
cat > .github/agents/bsm-autonomous-architect.agent.md <<'EOF'
---
name: BSM Autonomous Architect
description: >
  Agent معماري وتشغيلي لمنصة BSM. يحلل المستودع، يقترح إعادة هيكلة،
  يصيغ خطط أتمتة، ويولد وثائق تشغيلية دون كشف أسرار.
---

# BSM Autonomous Architect

Purpose: تحليل بنية المستودع، اقتراح تحسينات، تصميم سلاسل Agents، وتوليد وثائق.
Capabilities:
- مسح ملفات المستودع وبناء خريطة هيكلية
- اقتراح refactors وملفات إعادة تنظيم
- توليد خطط CI/CD قابلة للتنفيذ
- إخراج توصيات بصيغة Markdown أو قالب PR
Constraints:
- لا يطلب أو يعرض أسرار
- لا يعدل الملفات بدون أمر صريح من المستخدم
Integration notes:
- يدعم استدعاء Copilot CLI محلياً: copilot agents run architect --repo . --output architect.json
- يدعم إخراج JSON لتغذية Orchestrator
EOF

cat > .github/agents/orchestrator.agent.md <<'EOF'
---
name: BSM Orchestrator
description: >
  Orchestrator ينسق تنفيذ Agents الأخرى، يدير تسلسل المهام، ويجمع نتائج التحليل.
---

# BSM Orchestrator

Purpose: تنفيذ تسلسل مهام مؤتمت، تجميع مخرجات Agents، وإصدار تقارير ملخصة.
Flow:
1. استدعاء Architect لإنتاج JSON توصيات.
2. استدعاء Runner لتشغيل اختبارات وبناء محاكاة.
3. استدعاء Security لفحص التهيئات والاعتمادات.
4. تجميع النتائج في تقرير Markdown: reports/agents-summary-<timestamp>.md.
Execution:
- محلي: copilot agents run orchestrator --config .github/agents/orchestrator.config.json
- في CI: استدعاء سكربت scripts/run_agents.sh
Outputs:
- reports/agents-summary-<timestamp>.md
- (اختياري) فتح PR اقتراحي مع التغييرات المقترحة بعد موافقة صريحة
Security:
- يقرأ أسرار من متغيرات بيئة فقط
- لا يطبع أو يسجل قيم الأسرار
EOF

cat > .github/agents/runner.agent.md <<'EOF'
---
name: BSM Runner
description: >
  Agent مسؤول عن تنفيذ اختبارات البناء، محاكاة النشر، وتحليل الـ logs.
---

# BSM Runner

Purpose: تشغيل أوامر البناء والاختبار في بيئة معزولة، جمع الأخطاء، وإرجاع ملخص.
Capabilities:
- تشغيل npm/yarn, pytest, docker build حسب التكوين
- جمع logs وتحليل stack traces
- إخراج نتائج بصيغة JSON وملخص Markdown
Constraints:
- لا يدفع تغييرات تلقائياً
- يطلب إذن قبل أي كتابة أو فتح PR
Integration:
- يدعم التشغيل داخل GitHub Actions أو محلياً داخل container
- مثال استدعاء محلي: copilot agents run runner --target local --output runner-results.json
EOF

cat > .github/agents/security.agent.md <<'EOF'
---
name: BSM Security Agent
description: >
  Agent يفحص التهيئات، ملفات CI، ويقترح تحسينات لإدارة المفاتيح والسرية.
---

# BSM Security Agent

Purpose: فحص ملفات CI/CD، كشف تسريبات محتملة في الكود، اقتراح استخدام Key Management.
Capabilities:
- تحليل .github/workflows, env examples, ملفات config
- فحص الاعتمادات عبر أدوات خارجية إن وُجدت (Snyk, Trivy, Dependabot)
- اقتراح نقل الأسرار إلى Key Management وملفات secret scanning rules
Constraints:
- لا يعرض أو يطلب مفاتيح
- يعطي تعليمات لنقل الأسرار إلى Key Management
Integration:
- استدعاء محلي: copilot agents run security --scan . --output security-findings.json
- في CI: يقرأ قواعد من متغيرات بيئة أو ملف config
EOF

# Pull request template
cat > .github/PULL_REQUEST_TEMPLATE/agents-suggestions.md <<'EOF'
# اقتراحات BSM Agents

**الملخص**
هذا PR يحتوي على تقرير واقتراحات تم توليدها آلياً بواسطة منظومة BSM Agents.

**التغييرات المقترحة**
- إعادة هيكلة مجلدات مقترحة
- تحديثات في CI/CD لتسريع البناء
- توصيات أمنية لنقل الأسرار إلى Key Management

**ملاحظات**
- لا يتم تطبيق أي تغيير تلقائياً؛ راجع الاقتراحات وافق أو عدّل قبل الدمج.
EOF

# Workflow
cat > .github/workflows/agents-run.yml <<'EOF'
name: Run BSM Agents

on:
  workflow_dispatch:

jobs:
  run-agents:
    runs-on: ubuntu-latest
    env:
      KM_ENDPOINT: ${{ secrets.KM_ENDPOINT }}
      KM_TOKEN: ${{ secrets.KM_TOKEN }}
      SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install tools
        run: |
          sudo apt-get update
          sudo apt-get install -y jq
          npm install -g snyk || true

      - name: Make scripts executable
        run: chmod +x scripts/run_agents.sh

      - name: Run agents script
        run: ./scripts/run_agents.sh reports false

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: agents-report
          path: reports/
EOF

# Main run script (already exists, skip)

# Make scripts executable
chmod +x scripts/run_agents.sh
chmod +x scripts/bootstrap_bsm_agents.sh || true

# Commit all created files
git add .github/agents .github/PULL_REQUEST_TEMPLATE .github/workflows scripts
git commit -m "Bootstrap BSM Agents automation and workflow" || true

# Push branch
git push --set-upstream "${REMOTE}" "${BRANCH}"

# Optionally open PR
if [ "${OPEN_PR}" = "true" ]; then
  if command -v gh >/dev/null 2>&1; then
    gh pr create --title "${PR_TITLE}" --body "${PR_BODY}" --label "automation" --draft
    echo "Draft PR created: ${PR_TITLE}"
  else
    echo "gh CLI not found; PR not created. Install gh and run:"
    echo "  gh pr create --title \"${PR_TITLE}\" --body \"${PR_BODY}\" --label automation --draft"
  fi
fi

echo "Bootstrap complete. Branch: ${BRANCH}"
echo "To run the agents locally: ./scripts/run_agents.sh reports false"
echo "To run and open PR via local script: ./scripts/run_agents.sh reports true"
