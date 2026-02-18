import { createServer } from 'http';
import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";
import { validateRegistry } from "./utils/registryValidator.js";
import { initializeSocketIO } from "./services/socketService.js";
import { testConnection } from "./config/database.js";
import { initializeSchema } from "./services/observatoryDbService.js";

// Hard gate: validate registry before starting server
try {
  validateRegistry();
} catch (error) {
  logger.fatal({ error: error.message }, "Registry validation failed - server cannot start");
  process.exit(1);
}

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io for Observatory
initializeSocketIO(httpServer);

// Initialize Observatory database (non-blocking - log errors but don't crash)
(async () => {
  try {
    const connected = await testConnection();
    if (connected) {
      await initializeSchema();
      logger.info('Observatory database initialized');
    } else {
      logger.warn('Observatory database not available - metrics collection disabled');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Observatory database - metrics collection disabled');
  }
})();

httpServer.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, "BSU API with Observatory started");
});
