import express from "express";
import { scrapeSources } from "../controllers/scrapeController.js";

const router = express.Router();

router.post("/", scrapeSources);

export default router;

