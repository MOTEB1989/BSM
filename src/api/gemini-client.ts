import { BaseMockAIClient } from './base-client';

export class GoogleGeminiClient extends BaseMockAIClient {
  constructor() {
    super('gemini');
  }
}
