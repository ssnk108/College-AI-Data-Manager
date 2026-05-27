import express from "express";
import {
  createCollege,
  deleteCollege,
  getCollegeById,
  getColleges,
  updateCollege
} from "../controllers/collegeController.js";
import { requireDatabase } from "../middleware/dbReadyMiddleware.js";

const router = express.Router();

router.use(requireDatabase);

router.route("/").post(createCollege).get(getColleges);
router.route("/:id").get(getCollegeById).put(updateCollege).delete(deleteCollege);

export default router;
