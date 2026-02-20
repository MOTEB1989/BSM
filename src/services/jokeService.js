import fetch from "node-fetch";
import { AppError } from "../utils/errors.js";
import { getCircuitBreaker } from "../utils/circuitBreaker.js";
import logger from "../utils/logger.js";

const JOKE_API_URL = "https://v2.jokeapi.dev/joke/Any?type=single";
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

// Create circuit breaker for JokeAPI
const jokeApiCircuitBreaker = getCircuitBreaker('joke-api', {
  failureThreshold: 5,
  resetTimeout: 30000
});

/**
 * Fetch a random joke from JokeAPI
 * @returns {Promise<string>} The joke text
 * @throws {AppError} If the API call fails
 */
export const getRandomJoke = async () => {
  return jokeApiCircuitBreaker.execute(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      logger.info('Fetching random joke from JokeAPI');
      
      const res = await fetch(JOKE_API_URL, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "BSM-Joke-Service/1.0"
        },
        signal: controller.signal
      });

      if (!res.ok) {
        throw new AppError(
          `JokeAPI returned status ${res.status}`,
          res.status,
          "JOKE_API_ERROR"
        );
      }

      const data = await res.json();

      // JokeAPI can return single jokes or two-part jokes
      // We're filtering for single type only in the URL, but handle both cases
      if (data.error) {
        throw new AppError(
          data.message || "JokeAPI returned an error",
          500,
          "JOKE_API_ERROR"
        );
      }

      // Return the joke (single type)
      if (data.joke) {
        logger.info('Successfully fetched joke');
        return data.joke;
      }

      // Fallback for two-part jokes (setup + delivery)
      if (data.setup && data.delivery) {
        logger.info('Successfully fetched two-part joke');
        return `${data.setup} ${data.delivery}`;
      }

      throw new AppError("No joke found in API response", 500, "NO_JOKE_FOUND");

    } catch (error) {
      if (error.name === 'AbortError') {
        logger.error('JokeAPI request timed out');
        throw new AppError("Request timeout while fetching joke", 504, "REQUEST_TIMEOUT");
      }

      if (error instanceof AppError) {
        throw error;
      }

      logger.error({ error: error.message }, 'Error fetching joke from JokeAPI');
      throw new AppError(
        "Failed to fetch joke from external API",
        500,
        "JOKE_API_ERROR"
      );
    } finally {
      clearTimeout(timeout);
    }
  });
};
