import express from "express";
import { getPrivateCollege, updatePrivateCollege } from "../controllers/privateCollegeController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import { requireDatabase } from "../middleware/dbReadyMiddleware.js";

const router = express.Router();
router.use(requireAdmin, requireDatabase);
router.get("/college/:id", getPrivateCollege);
router.put("/college/:id", updatePrivateCollege);
export default router;
