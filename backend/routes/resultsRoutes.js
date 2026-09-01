import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_RESULTS_DIR = path.join(__dirname, "..", "results");

const resultsListLimiter = rateLimit({
  windowMs: 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const resultsDownloadLimiter = rateLimit({
  windowMs: 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createResultsRouter(
  resultsDir = DEFAULT_RESULTS_DIR,
  listLimiter = resultsListLimiter,
  downloadLimiter = resultsDownloadLimiter
) {
  const router = express.Router();

  router.get("/", listLimiter, (req, res) => {
    if (!fs.existsSync(resultsDir)) {
      return res.json([]);
    }

    res.json(walkResults(resultsDir, resultsDir));
  });

  router.get("/download", downloadLimiter, (req, res) => {
    const relativePath = req.query.path;

    if (!relativePath) {
      return res.status(400).send("Missing file path");
    }

    const safeRoot = path.resolve(resultsDir);
    const filePath = path.resolve(safeRoot, relativePath);

    // Prevent access to files outside resultsDir
    if (!filePath.startsWith(safeRoot + path.sep)) {
      return res.status(400).send("Invalid path");
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    res.download(filePath);
  });

  return router;
}

function walkResults(dir, baseDir) {
  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(
        walkResults(fullPath, baseDir)
      );
    } else {
      const stats = fs.statSync(fullPath);

      files.push({
        name: entry.name,
        relativePath: path.relative(baseDir, fullPath),
        size: stats.size,
      });
    }
  }

  return files;
}

export default createResultsRouter();