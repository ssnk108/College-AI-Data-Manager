import express from "express";
import { getPrivateCollege, updatePrivateCollege } from "../controllers/privateCollegeController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/college/:id", requireAdmin, getPrivateCollege);
router.put("/college/:id", requireAdmin, updatePrivateCollege);
export default router;

