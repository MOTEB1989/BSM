import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { correlationMiddleware } from "./middleware/correlation.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { lanOnlyMiddleware } from "./middleware/lanOnly.js";
import { mobileModeMiddleware } from "./middleware/mobileMode.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { adminUiAuth } from "./middleware/auth.js";
import { env } from "./config/env.js";
import { getHealth } from "./controllers/healthController.js";
import { initializeAgents } from "./agents/index.js";
import logger from "./utils/logger.js";

import routes from "./routes/index.js";

const app = express();

// Initialize AI agents
try {
  const agents = initializeAgents({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  });
  
  // Store agents in app.locals for access in routes
  app.locals.agents = agents;
  
  logger.info("AI Agents initialized", { 
    count: agents.list().length,
    names: agents.list()
  });
} catch (error) {
  logger.warn("AI Agents initialization failed (non-critical)", { error: error.message });
  // Non-critical - app can run without AI agents
}

const corsOptions = env.corsOrigins.length
  ? {
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      }
    }
  : { origin: true };

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use(correlationMiddleware);
app.use(requestLogger);

// Apply security middleware
app.use(lanOnlyMiddleware);
app.use(mobileModeMiddleware);

app.use(
  "/api",
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use("/api", routes);

// keep compatibility with health checks expecting a top-level route
app.get("/health", getHealth);

// root path redirects to chat UI
app.get("/", (req, res) => res.redirect("/chat"));

// /docs and /docs/* redirect to chat UI to prevent JSON 404
app.get("/docs*", (req, res) => res.redirect("/chat"));

// serve admin UI static
app.use("/admin", adminUiAuth, express.static(path.join(process.cwd(), "src/admin")));
app.use(
  "/chat",
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          "https://unpkg.com",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net"
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...env.corsOrigins]
      }
    }
  }),
  express.static(path.join(process.cwd(), "src/chat"))
);

app.use(notFound);
app.use(errorHandler);

export default app;
