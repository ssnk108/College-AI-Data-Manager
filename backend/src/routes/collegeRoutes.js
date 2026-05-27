import express from "express";
import {
  createCollege,
  deleteCollege,
  getCollegeByIdAdmin,
  getCollegeById,
  getColleges,
  mergeCollege,
  updateCollege
} from "../controllers/collegeController.js";
import { requireDatabase } from "../middleware/dbReadyMiddleware.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireDatabase);

router.route("/").get(getColleges).post(requireAdmin, createCollege);
router.post("/merge/:id", requireAdmin, mergeCollege);
router.get("/:id/public", getCollegeById);
router.get("/:id/admin", requireAdmin, getCollegeByIdAdmin);
router.route("/:id").get(getCollegeById).put(requireAdmin, updateCollege).delete(requireAdmin, deleteCollege);

export default router;
