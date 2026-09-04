import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  standardReadLimiter,
} from "../security/rateLimiters.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultOutputPath = path.join(
  __dirname,
  "../converter/json_files/topology.json"
);

export function createTopologyRouter(
  outputPath = defaultOutputPath,
  limiter = standardReadLimiter
) {
  const router = express.Router();

  router.post("/save", limiter, (req, res) => {
    console.log("Received topology save request");

    fs.mkdirSync(path.dirname(outputPath), {
      recursive: true,
    });

    fs.writeFileSync(
      outputPath,
      JSON.stringify(req.body, null, 2)
    );

    res.json({
      message: "Saved",
    });
  });

  return router;
}

export default createTopologyRouter();