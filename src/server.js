import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";
import { validateRegistry } from "./utils/registryValidator.js";

// Hard gate: validate registry before starting server
try {
  await validateRegistry();
} catch (error) {
  logger.fatal({ error: error.message }, "Registry validation failed - server cannot start");
  process.exit(1);
}

app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, "BSU API started");
});
