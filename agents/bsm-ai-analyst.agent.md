---
name: BSM-AI-Analyst
description: وكيل ذكي يحلل البيانات ويولد تقارير باستخدام الذكاء الاصطناعي
version: 1.2.0
author: BSM
license: MIT
triggers:
  - event: push
    conditions:
      - files_changed: ["data/*.csv", "reports/*.json"]
actions:
  - name: Load Data
    run: python scripts/load_data.py --input ./data/latest.csv
  - name: Generate Report with AI
    run: python scripts/generate_report_with_ai.py --provider openai --model gpt-4o
  - name: Publish Insights
    run: python scripts/publish_insights.py --output ./reports/insights.md
permissions:
  contents: write
  pull-requests: read
---
