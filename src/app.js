import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { correlationMiddleware } from "./middleware/correlation.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { adminUiAuth } from "./middleware/auth.js";
import { env } from "./config/env.js";

import routes from "./routes/index.js";

const app = express();

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

// root path redirects to chat UI
app.get("/", (req, res) => res.redirect("/chat"));

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
