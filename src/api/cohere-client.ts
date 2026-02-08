import { BaseMockAIClient } from './base-client';

export class CohereClient extends BaseMockAIClient {
  constructor() {
    super('cohere');
  }
}
