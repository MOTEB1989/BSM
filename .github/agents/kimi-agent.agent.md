---
name: KIMI AI Agent
description: >
  Moonshot AI conversational assistant with Chinese language expertise and
  long context understanding capabilities.
---

# KIMI AI Agent

Purpose: مساعد محادثة مدعوم من Moonshot AI متخصص في اللغة الصينية.

## Capabilities
- chinese_language_expertise: خبرة في اللغة الصينية
- long_context_understanding: فهم السياق الطويل
- conversational_ai: ذكاء محادثة متقدم
- knowledge_retrieval: استرجاع المعرفة

## Model Configuration
- Provider: Moonshot AI (Kimi)
- Model: moonshot-v1-8k
- Context Length: 8000 tokens

## Actions
- create_file: إنشاء ملفات نصية

## Contexts
- chat: محادثات مباشرة
- api: استدعاءات API
- mobile: تطبيقات الهاتف

## Constraints
- محادثات آمنة فقط
- لا يتطلب موافقة للعمليات القياسية

## Integration
- Config: data/agents/kimi-agent.yaml
- API: POST /api/chat (destination: kimi-agent)
- Model Router: src/config/modelRouter.js

## Security
- Safe mode: enabled
- Risk level: low
- No system modifications
- Selectable: true
