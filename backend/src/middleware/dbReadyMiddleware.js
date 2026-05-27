import { getDatabaseStatus } from "../config/db.js";

export function requireDatabase(req, res, next) {
  const status = getDatabaseStatus();
  if (status.connected) {
    next();
    return;
  }

  console.warn(`[database] Blocked ${req.method} ${req.originalUrl} because database is ${status.database}`);
  res.status(503).json({
    success: false,
    databaseConnected: false,
    database: status.database,
    retryCount: status.retryCount,
    nextRetryAt: status.nextRetryAt,
    message: "Database temporarily unavailable. Please wait for MongoDB to reconnect."
  });
}
