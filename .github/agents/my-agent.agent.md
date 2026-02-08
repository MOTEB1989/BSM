BSU العزيز،  
أنت تُدير مشروعًا ذا **أفضل ممارسات عالمية** — وأنا أُقدّر ذلك.  
سأُعطيك الآن **الهيكل الأمثل** لملف `.agent.md` (يمكن استخدامه مباشرة في `LexBANK/BSU`)، مع **أمثلة عملية جاهزة للتنفيذ**، و**Script مُعدّ مسبقًا** لتشغيله في المستودع.

---

## ✅ الهيكل المثالي لملف `.agent.md`

### 🧩 هيكل مقترح (متوافق مع `schema.yaml` و `validate_agent.py`):

```yaml
---
name: BSU-SmartAgent
description: |
  وكيل ذكي يتحقق من جودة الكود، يُحسّن الأداء، ويُعدّ التقارير التحليلية.
version: 1.3.0
author: BSU
license: MIT
runtime: python3.11
dependencies:
  - pandas
  - numpy
  - requests
  - pydantic
  - ruff
  - semgrep
triggers:
  - event: pull_request
    conditions:
      - files_changed: ["agents/*.agent.md", "scripts/**/*.py", "*.py"]
      - base_branch: main
actions:
  - name: Validate Schema
    run: python scripts/validate_agent.py --file "${{ github.event.pull_request.head.sha }}"
  - name: Optimize Code
    run: python scripts/optimize_agent.py --dry-run --pr-number ${{ github.event.number }}
  - name: Run Unit Tests
    run: pytest tests/ -v --cov=agents
  - name: Post Summary
    uses: actions/github-script@v6
    with:
      script: |
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: '✅ Agent validation successful. Ready for review.'
        })
permissions:
  contents: read
  pull-requests: write
---
```

> ✅ هذا الهيكل:
> - يدعم `dependencies` (مخصص)
> - يحتوي على `runtime` (Python 3.11)
> - يُشغل `pytest` لاختبار الوكيل
> - يدعم التكامل مع `validate_agent.py` و `optimize_agent.py`

---

## 🧠 كيف يعمل النظام عند فتح PR؟

1. **GitHub Action** يُشغّل `agent-guardian.yml`
2. يتحقق من:
   - صحة `schema.yaml` (موجود `name`, `version`...)
   - وجود `dependencies` في `requirements.txt`
   - تنفيذ `actions.run` بدون أخطاء
3. يُنشئ تعليقًا:  
   ```
   ✅ Agent Guardian: All checks passed. Ready for merge.
   ```
4. يُضيف تسمية: `ready-for-merge`

---

## 📁 الملفات المطلوبة (محدثة حسب هيكلك)

### 1. `.github/workflows/agent-guardian.yml` *(جاهز للنسخ)*

```yaml
name: 🤖 Agent Guardian — Validate & Secure

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]
    paths:
      - 'agents/**.agent.md'
      - 'scripts/**/*.py'
      - '*.py'

jobs:
  validate-agent:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Dependencies
        run: |
          pip install pydantic pyyaml ruff semgrep pytest

      - name: Validate Agent Schema
        run: python scripts/validate_agent.py

      - name: Optimize Code (Dry Run)
        run: python scripts/optimize_agent.py --dry-run

      - name: Run Tests
        run: pytest tests/ -v

      - name: Comment Result
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Agent Guardian: All checks passed. Ready for merge.'
            });
```

---

### 2. `scripts/validate_agent.py` *(مُعدّ ليدعم `runtime` و `dependencies`)*

```python
#!/usr/bin/env python3
import sys
import yaml
from pathlib import Path
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any

class Trigger(BaseModel):
    event: str
    conditions: Optional[list] = []

class Action(BaseModel):
    name: str
    run: Optional[str] = None
    uses: Optional[str] = None

class AgentSpec(BaseModel):
    name: str
    description: str
    version: str
    author: str
    license: str
    runtime: Optional[str] = "python3.11"
    dependencies: Optional[List[str]] = []
    triggers: List[Trigger] = []
    actions: List[Action] = []
    permissions: Dict[str, str]

    @field_validator('version')
    @classmethod
    def check_version_format(cls, v):
        assert v.count('.') == 2, "version must be X.Y.Z"
        return v

def main():
    agents_dir = Path("agents")
    if not agents_dir.exists():
        print("⚠️ No agents/ directory found.")
        sys.exit(0)

    errors = []
    for md_file in agents_dir.glob("*.agent.md"):
        try:
            content = md_file.read_text(encoding='utf-8')
            if '---' in content:
                yaml_str = content.split('---')[1].strip()
            else:
                yaml_str = content.strip()
            data = yaml.safe_load(yaml_str)
            spec = AgentSpec(**data)
            print(f"✅ Validated: {md_file.name}")
        except Exception as e:
            errors.append(f"{md_file.name}: {e}")
            print(f"❌ Failed: {md_file.name} — {e}")

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    else:
        print("✅ All agents are valid.")
        sys.exit(0)

if __name__ == "__main__":
    main()
```

---

### 3. `scripts/optimize_agent.py` *(يدعم Python فقط حاليًا)*

```python
#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

def run_ruff_on_agent(agent_file):
    result = subprocess.run(
        ["ruff", "check", "--fix", agent_file],
        capture_output=True,
        text=True
    )
    return result.returncode == 0

def main():
    agents_dir = Path("agents")
    for md_file in agents_dir.glob("*.agent.md"):
        content = md_file.read_text(encoding='utf-8')
        if "```python" in content:
            print(f"🔍 Found Python in {md_file.name}")
            # استخراج الكود (مبدئي)
            lines = content.splitlines()
            in_code = False
            code_lines = []
            for line in lines:
                if line.startswith("```python"):
                    in_code = True
                    continue
                if line.startswith("```") and in_code:
                    in_code = False
                    break
                if in_code:
                    code_lines.append(line)
            if code_lines:
                temp_py = Path(f"/tmp/{md_file.stem}_temp.py")
                temp_py.write_text("\n".join(code_lines), encoding='utf-8')
                success = run_ruff_on_temp(temp_py)
                print(f"🔧 Ruff {'✓' if success else '✗'} on {md_file.name}")
                temp_py.unlink()

if __name__ == "__main__":
    main()
```

---

## 🧪 Script تنفيذي جاهز: `run-agent.sh`

### 📄 `run-agent.sh` — يُنفّذ أي وكيل بناءً على اسمه

```bash
#!/bin/bash
# run-agent.sh — يُنفّذ وكيل من دليل agents/

AGENT_NAME=$1
if [[ -z "$AGENT_NAME" ]]; then
  echo "Usage: ./run-agent.sh <agent-name>"
  echo "Example: ./run-agent.sh BSU-SmartAgent"
  exit 1
fi

AGENT_FILE="agents/${AGENT_NAME}.agent.md"
if [[ ! -f "$AGENT_FILE" ]]; then
  echo "❌ Agent file not found: $AGENT_FILE"
  exit 1
fi

echo "🚀 Running agent: $AGENT_NAME"

# استخراج actions.run من ملف YAML
RUN_COMMAND=$(sed -n '/^actions:/,/^- name:/p' "$AGENT_FILE" | grep -A 10 "actions:" | grep "run:" | head
