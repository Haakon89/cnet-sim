import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createResultsRouter(
  resultsDir = path.join(__dirname, "..", "results")
) {
  const router = express.Router();

  router.get("/", (req, res) => {
    if (!fs.existsSync(resultsDir)) {
      return res.json([]);
    }

    res.json(walkResults(resultsDir, resultsDir));
  });

  router.get("/download", (req, res) => {
    const relativePath = req.query.path;

    if (!relativePath) {
      return res.status(400).send("Missing file path");
    }

    const filePath = path.resolve(resultsDir, relativePath);
    const safeRoot = path.resolve(resultsDir);

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