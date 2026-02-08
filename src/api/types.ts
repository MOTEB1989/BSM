export type JsonRecord = Record<string, unknown>;

export interface ReportParams {
  title: string;
  data: unknown;
  format?: 'markdown' | 'json' | 'text';
  model?: string;
}

export interface ReportResult {
  content: string;
  provider: string;
  model?: string;
  metadata?: JsonRecord;
}

export interface AIProvider {
  readonly name: string;
  generateReport(params: ReportParams): Promise<ReportResult>;
  analyzeData(data: unknown): Promise<JsonRecord>;
}
