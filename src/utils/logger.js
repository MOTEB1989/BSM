import pino from "pino";
import { env } from "../config/env.js";

const logger =
  env.nodeEnv === "production"
    ? pino({ level: env.logLevel })
    : pino({
        level: env.logLevel,
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" }
        }
      });

export default logger;
