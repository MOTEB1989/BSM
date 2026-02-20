/**
 * BSM Platform - Go Service Client
 * HTTP client for communicating with Go microservices
 */

import fetch from "node-fetch";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("GoServiceClient");

/**
 * Base client for Go microservices
 */
class GoServiceClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
  }

  /**
   * Make HTTP request to Go service
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": options.correlationId || this.generateRequestId(),
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Go service error: ${response.status} ${response.statusText} - ${errorBody}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (error.name === "AbortError") {
          logger.error(
            { url, timeout: this.timeout },
            "Go service request timeout"
          );
          throw new Error("Go service timeout");
        }

        if (attempt < this.retries) {
          logger.warn(
            { err: error, url, attempt, maxAttempts: this.retries },
            "Go service request failed, retrying..."
          );
          await this.sleep(Math.min(1000 * Math.pow(2, attempt - 1), 5000));
          continue;
        }

        logger.error({ err: error, url }, "Go service request failed");
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Document Processor Service Client
 */
class DocumentProcessorClient extends GoServiceClient {
  constructor(baseUrl) {
    super(baseUrl || process.env.GO_DOCUMENT_SERVICE || "http://localhost:8080");
  }

  /**
   * Parse document (PDF, DOCX, etc.)
   */
  async parseDocument(fileUrl, options = {}) {
    logger.info({ fileUrl, format: options.format }, "Parsing document");

    const response = await this.request("/api/v1/documents/parse", {
      method: "POST",
      body: JSON.stringify({
        file_url: fileUrl,
        format: options.format || "pdf",
      }),
      correlationId: options.correlationId,
    });

    logger.info(
      { fileUrl, pages: response.pages },
      "Document parsed successfully"
    );

    return response;
  }

  /**
   * Get document metadata
   */
  async getMetadata(documentId, options = {}) {
    return await this.request(`/api/v1/documents/${documentId}/metadata`, {
      method: "GET",
      correlationId: options.correlationId,
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return await this.request("/health", {
      method: "GET",
    });
  }
}

/**
 * Search Service Client
 */
class SearchServiceClient extends GoServiceClient {
  constructor(baseUrl) {
    super(baseUrl || process.env.GO_SEARCH_SERVICE || "http://localhost:8081");
  }

  /**
   * Search documents
   */
  async search(query, options = {}) {
    logger.info({ query }, "Searching documents");

    const response = await this.request("/api/v1/search/query", {
      method: "POST",
      body: JSON.stringify({
        query: query,
        limit: options.limit || 10,
        offset: options.offset || 0,
      }),
      correlationId: options.correlationId,
    });

    logger.info(
      { query, results: response.total },
      "Search completed successfully"
    );

    return response;
  }

  /**
   * Index document
   */
  async indexDocument(document, options = {}) {
    return await this.request("/api/v1/search/index", {
      method: "POST",
      body: JSON.stringify(document),
      correlationId: options.correlationId,
    });
  }

  /**
   * Get autocomplete suggestions
   */
  async suggest(prefix, options = {}) {
    const encodedPrefix = encodeURIComponent(prefix || "");
    return await this.request(`/api/v1/search/suggest?prefix=${encodedPrefix}`, {
      method: "GET",
      headers: {
        ...options.headers,
      },
      correlationId: options.correlationId,
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return await this.request("/health", {
      method: "GET",
    });
  }
}

// Export configured clients
export const documentProcessorClient = new DocumentProcessorClient();
export const searchServiceClient = new SearchServiceClient();

// Export classes for custom instantiation
export { DocumentProcessorClient, SearchServiceClient, GoServiceClient };
