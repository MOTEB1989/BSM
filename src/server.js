import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";
import { validateRegistry } from "./utils/registryValidator.js";
import { initializeDatabase } from "./database/client.js";
import { connectRedis } from "./database/redis.js";
import { unifiedGateway } from "./services/gateway/unifiedGateway.js";

// Hard gate: validate registry before starting server
try {
  validateRegistry();
} catch (error) {
  logger.fatal({ error: error.message }, "Registry validation failed - server cannot start");
  process.exit(1);
}

// Initialize gateway services (non-blocking)
(async () => {
  try {
    await initializeDatabase();
    await connectRedis();
    await unifiedGateway.initialize();
    logger.info('Gateway services initialized');
  } catch (error) {
    logger.warn({ error: error.message }, 'Gateway initialization failed, some features may be limited');
  }
})();

app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, "BSU API started");
});
