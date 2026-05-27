import mongoose from "mongoose";

export function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    next();
    return;
  }

  res.status(503).json({
    message: "Database is not connected yet. Check MongoDB Atlas network access, credentials, and MONGO_URI."
  });
}

