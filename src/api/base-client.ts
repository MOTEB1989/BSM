import type { AIProvider, ReportParams, ReportResult, JsonRecord } from './types';

export class BaseMockAIClient implements AIProvider {
  constructor(public readonly name: string) {}

  async generateReport(params: ReportParams): Promise<ReportResult> {
    const summary = typeof params.data === 'string'
      ? params.data.slice(0, 300)
      : JSON.stringify(params.data, null, 2).slice(0, 300);

    return {
      content: `# ${params.title}\n\nProvider: ${this.name}\n\n## Summary\n${summary}`,
      provider: this.name,
      model: params.model,
      metadata: {
        format: params.format ?? 'markdown',
      },
    };
  }

  async analyzeData(data: unknown): Promise<JsonRecord> {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return {
      provider: this.name,
      length: serialized.length,
      recommendations: [
        `Use ${this.name} for deeper trend detection.`,
        'Add domain-specific prompt templates for better consistency.',
      ],
    };
  }
}
