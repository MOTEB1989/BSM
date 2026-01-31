import express from "express";
import cors from "cors";
import path from "path";

import { correlationMiddleware } from "./middleware/correlation.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

import routes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use(correlationMiddleware);
app.use(requestLogger);

app.use("/api", routes);

// serve admin UI static
app.use("/admin", express.static(path.join(process.cwd(), "src/admin")));
app.use("/chat", express.static(path.join(process.cwd(), "src/chat")));

app.use(notFound);
app.use(errorHandler);

export default app;
