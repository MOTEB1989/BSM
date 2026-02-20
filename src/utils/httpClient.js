/**
 * Shared HTTP Client
 *
 * Centralizes fetch logic with timeout, error mapping, and consistent handling
 * for 401/403/429/502. Used by gptService and modelRouter.
 *
 * Eliminates duplication between callChatAPI, callAnthropicAPI, and postChat.
 */

import fetch from "node-fetch";
import { AppError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Sanitize API key: remove whitespace, newlines, invisible characters
 */
export const sanitizeApiKey = (apiKey) => {
  if (typeof apiKey !== "string") return "";
  return apiKey.replace(/[\s\r\n\t\u200B-\u200D\uFEFF]/g, "");
};

/**
 * POST JSON with timeout and standard error handling
 *
 * @param {string} url - Request URL
 * @param {Object} options
 * @param {string} options.authHeader - Full Authorization header value (e.g. "Bearer sk-...")
 * @param {Object} options.headers - Additional headers
 * @param {Object} options.body - JSON body (will be stringified)
 * @param {number} options.timeoutMs - Request timeout (default 30000)
 * @param {string} options.providerName - For error messages
 * @returns {Promise<Object>} Parsed JSON response
 */
export const postJson = async (url, options = {}) => {
  const {
    authHeader,
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    providerName = "API"
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();

      if (res.status === 401 || res.status === 403) {
        throw new AppError(
          `${providerName} API key is invalid or unauthorized`,
          503,
          "INVALID_API_KEY"
        );
      }

      if (res.status === 429) {
        throw new AppError(
          `${providerName} rate limit exceeded`,
          429,
          "RATE_LIMITED"
        );
      }

      throw new AppError(
        `${providerName} request failed: ${text}`,
        502,
        "PROVIDER_ERROR"
      );
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new AppError(
        `${providerName} request timeout`,
        500,
        "PROVIDER_TIMEOUT"
      );
    }
    if (
      err.code === "ENOTFOUND" ||
      err.code === "ECONNREFUSED" ||
      err.message?.includes("ENOTFOUND")
    ) {
      throw new AppError(
        `Cannot connect to ${providerName} API - network or DNS issue`,
        503,
        "NETWORK_ERROR"
      );
    }
    throw err;
  }
};
