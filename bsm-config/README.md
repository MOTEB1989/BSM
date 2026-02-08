# BSM Config

This folder centralizes AI-provider configuration for BSM-AgentOS.

## What is included
- Environment template for 8 AI providers.
- Provider discovery via `getEnabledProviders()`.
- A factory that selects the primary AI client.

## Usage
1. Copy `.env.example` to `.env` and add API keys.
2. Import `APIClientFactory` from `config/ai-providers.ts`.
3. Call `APIClientFactory.fromProviders(getEnabledProviders())`.
