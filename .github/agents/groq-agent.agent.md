---
name: Groq AI Agent
description: >
  Ultra-fast AI inference powered by Groq's LPU technology, ideal for
  real-time conversational applications and rapid responses.
---

# Groq AI Agent

Purpose: استدلال فائق السرعة مدعوم بتقنية LPU من Groq.

## Capabilities
- ultra_fast_inference: استدلال فائق السرعة
- real_time_conversation: محادثة في الوقت الفعلي
- low_latency: زمن استجابة منخفض
- high_throughput: إنتاجية عالية

## Model Configuration
- Provider: Groq
- Model: llama-3.3-70b-versatile
- LPU Technology: enabled
- Speed: >500 tokens/second

## Actions
- create_file: إنشاء ملفات

## System Prompt
You are an AI assistant powered by Groq's ultra-fast LPU technology.
You provide rapid, accurate responses while maintaining high quality.
Prioritize clarity and helpfulness in all interactions.

## Contexts
- chat: محادثات مباشرة
- api: استدعاءات API
- mobile: تطبيقات الهاتف

## Integration
- Config: data/agents/groq-agent.yaml
- API: POST /api/chat (destination: groq-agent)
- Implementation: src/api/groq-client.ts

## Security
- Safe mode: enabled
- Risk level: low
- No system modifications
- Selectable: true
- Rate limiting: enforced

## Performance
- Inference Speed: >500 tokens/second
- Latency: <100ms first token
- Optimal for: Real-time chat, streaming responses
