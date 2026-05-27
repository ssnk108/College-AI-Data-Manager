import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import privateRoutes from "./routes/privateRoutes.js";
import scrapeRoutes from "./routes/scrapeRoutes.js";

dotenv.config();

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

app.use("/api/colleges", collegeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/scrape", scrapeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/private", privateRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    app.listen(port, () => console.log(`API running on port ${port}`));
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error("Shutting down server because MongoDB is required.");
    process.exit(1);
  }
}

startServer();
