import { BaseMockAIClient } from './base-client';

export class AzureOpenAIClient extends BaseMockAIClient {
  constructor() {
    super('azure');
  }
}
