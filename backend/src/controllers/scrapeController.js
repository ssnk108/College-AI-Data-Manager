import { scrapeUrls } from "../services/scraperService.js";

export async function scrapeSources(req, res, next) {
  try {
    const { urls = [] } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400);
      throw new Error("Provide at least one URL to scrape");
    }

    const pages = await scrapeUrls(urls);
    res.json({ pages });
  } catch (error) {
    next(error);
  }
}

