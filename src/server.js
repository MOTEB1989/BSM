import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";
import { validateRegistry } from "./utils/registryValidator.js";

// Validate admin token in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_TOKEN) {
    logger.fatal('ADMIN_TOKEN is required in production');
    process.exit(1);
  }
  if (process.env.ADMIN_TOKEN === 'change-me') {
    logger.fatal('ADMIN_TOKEN cannot be "change-me" in production');
    process.exit(1);
  }
  if (process.env.ADMIN_TOKEN.length < 16) {
    logger.fatal('ADMIN_TOKEN must be at least 16 characters');
    process.exit(1);
  }
  logger.info('✅ Admin token validation passed');
}

// Hard gate: validate registry before starting server
try {
  validateRegistry();
} catch (error) {
  logger.fatal({ error: error.message }, "Registry validation failed - server cannot start");
  process.exit(1);
}

app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, "BSU API started");
});
