"""RAG client for Node.js integration."""
import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Client for RAG service integration
 */
export class RAGClient {
  constructor(baseUrl = null) {
    this.baseUrl = baseUrl || process.env.RAG_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make request to RAG service
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`RAG service error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      logger.error({ err, url }, 'RAG service request failed');
      throw err;
    }
  }

  /**
   * Chat with RAG-powered assistant
   */
  async chat(message, options = {}) {
    const {
      language = 'ar',
      useRAG = true,
      topK = 3,
      conversationId = null
    } = options;

    logger.info({ message, language, useRAG }, 'RAG chat request');

    const response = await this.request('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        language,
        use_rag: useRAG,
        top_k: topK,
        conversation_id: conversationId
      })
    });

    logger.info({ sources: response.sources?.length }, 'RAG chat response');
    return response;
  }

  /**
   * Search documents
   */
  async search(query, options = {}) {
    const {
      language = 'ar',
      topK = 5,
      filters = null,
      includeSources = true
    } = options;

    logger.info({ query, language, topK }, 'RAG search request');

    const response = await this.request('/api/v1/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        language,
        top_k: topK,
        filters,
        include_sources: includeSources
      })
    });

    logger.info({ results: response.total_results }, 'RAG search response');
    return response;
  }

  /**
   * Upload document (admin only)
   */
  async uploadDocument(file, metadata, adminToken) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata fields
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.author) formData.append('author', metadata.author);
    if (metadata.document_type) formData.append('document_type', metadata.document_type);
    if (metadata.jurisdiction) formData.append('jurisdiction', metadata.jurisdiction);
    if (metadata.language) formData.append('language', metadata.language);
    if (metadata.version) formData.append('version', metadata.version);

    logger.info({ metadata }, 'Uploading document to RAG service');

    const response = await this.request('/api/v1/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'x-admin-token': adminToken
      }
    });

    return response;
  }

  /**
   * List documents
   */
  async listDocuments(page = 1, pageSize = 20) {
    const response = await this.request(
      `/api/v1/documents?page=${page}&page_size=${pageSize}`
    );
    return response;
  }

  /**
   * Get document details
   */
  async getDocument(documentId) {
    const response = await this.request(`/api/v1/documents/${documentId}`);
    return response;
  }

  /**
   * Delete document (admin only)
   */
  async deleteDocument(documentId, adminToken) {
    logger.info({ documentId }, 'Deleting document from RAG service');

    const response = await this.request(`/api/v1/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'x-admin-token': adminToken
      }
    });

    return response;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.request('/health');
      return response.status === 'healthy' || response.status === 'degraded';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const ragClient = new RAGClient();
