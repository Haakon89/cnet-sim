import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// routes/ is one level below backend root
const backendRoot = path.join(__dirname, "..");

router.post("/save", (req, res) => {
  console.log("Received topology save request");

  const topology = req.body;

  const outputDir = path.join(backendRoot, "converter", "json_files");
  const outputPath = path.join(outputDir, "topology.json");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(topology, null, 2));

  res.json({
    message: "Saved",
    path: outputPath,
  });
});

export default router;