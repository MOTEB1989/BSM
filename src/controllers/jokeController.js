import { getRandomJoke } from "../services/jokeService.js";
import { serverError } from "../utils/httpResponses.js";
import logger from "../utils/logger.js";

/**
 * Get a random joke from JokeAPI
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getJoke = async (req, res) => {
  try {
    const joke = await getRandomJoke();
    
    res.json({
      joke,
      source: "JokeAPI",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ 
      error: error.message, 
      code: error.code,
      correlationId: req.correlationId 
    }, 'Failed to fetch joke');
    
    // Return user-friendly error message
    return serverError(
      res, 
      'Failed to fetch joke. Please try again later.',
      error.message
    );
  }
};
