import express from "express";
import { adminLogin, adminMe } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/login", adminLogin);
router.get("/me", requireAdmin, adminMe);
export default router;
