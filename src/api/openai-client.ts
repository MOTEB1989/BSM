import { BaseMockAIClient } from './base-client';

export class OpenAIClient extends BaseMockAIClient {
  constructor() {
    super('openai');
  }
}
