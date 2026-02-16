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
import { handleGitHubWebhook } from "./controllers/webhookController.js";

import routes from "./routes/index.js";

const app = express();

// Trust proxy when behind reverse proxy (Render, Cloudflare, etc.)
app.set("trust proxy", 1);

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

// GitHub webhook endpoint (before security middleware to allow external requests)
// GitHub webhooks come from GitHub's servers, not from LAN or mobile devices
// Rate limited separately to prevent abuse while allowing legitimate webhook traffic
app.post(
  "/webhook/github",
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Allow 30 webhook requests per minute (reasonable for active repos)
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many webhook requests, please try again later"
  }),
  handleGitHubWebhook
);

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

// serve Kimi chat interface with CSP headers for external resources
app.get("/kimi-chat", 
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://unpkg.com",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...env.corsOrigins]
      }
    }
  }),
  (req, res) => {
    res.sendFile(path.join(process.cwd(), "docs/kimi-chat.html"));
  }
);

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
