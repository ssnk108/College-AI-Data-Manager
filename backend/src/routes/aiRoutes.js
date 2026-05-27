import express from "express";
import { extractCollege } from "../controllers/aiController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import { requireDatabase } from "../middleware/dbReadyMiddleware.js";

const router = express.Router();

router.post("/extract-college", requireAdmin, requireDatabase, extractCollege);

export default router;
