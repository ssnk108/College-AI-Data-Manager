import express from "express";
import { extractCollege } from "../controllers/aiController.js";

const router = express.Router();

router.post("/extract-college", extractCollege);

export default router;

