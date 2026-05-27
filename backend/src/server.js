import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { getDatabaseStatus, shutdownDatabase, startDatabaseConnection } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import privateRoutes from "./routes/privateRoutes.js";
import scrapeRoutes from "./routes/scrapeRoutes.js";

dotenv.config();

function validateStartupEnv() {
  const warnings = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_this_secret") warnings.push("JWT_SECRET should be set to a strong secret.");
  if (!process.env.GROQ_API_KEY) warnings.push("GROQ_API_KEY is missing. AI extraction will fail until it is set.");
  if (!process.env.FRONTEND_URL) warnings.push("FRONTEND_URL is not set. Using localhost defaults for CORS.");
  warnings.forEach((warning) => console.warn(`[startup] ${warning}`));
}

validateStartupEnv();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "College AI Data Manager API is running" });
});

app.get("/api/health", (req, res) => {
  const database = getDatabaseStatus();
  res.status(database.connected ? 200 : 503).json({
    success: database.connected,
    database: database.database,
    databaseConnected: database.connected,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    retryCount: database.retryCount,
    nextRetryAt: database.nextRetryAt,
    lastError: database.lastError
  });
});

app.use("/api/colleges", collegeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/scrape", scrapeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/private", privateRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`API running on port ${port}`);
  startDatabaseConnection().catch((error) => {
    console.error("Database startup failed:", error.message);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

async function gracefulShutdown(signal) {
  console.log(`${signal} received. Shutting down server...`);
  server.close(async () => {
    try {
      await shutdownDatabase();
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
