import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import {
  standardReadLimiter,
} from "../security/rateLimiters.js";

import {
  isValidSimpleName,
  resolveSafeFilePath,
} from "../security/pathSecurity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ANIM_DIR = path.join(
  __dirname,
  "..",
  "animation"
);

export function createAnimationRouter(
  animationDir = DEFAULT_ANIM_DIR,
  listLimiter = standardReadLimiter,
  readLimiter = standardReadLimiter
) {
  const router = express.Router();
  const resolvedAnimationDir =
    path.resolve(animationDir);

  router.get(
    "/",
    listLimiter,
    async (req, res) => {
      try {
        const canonicalRoot =
          await fs.realpath(
            resolvedAnimationDir
          );

        const files =
          await fs.readdir(canonicalRoot);

        const animations = files
          .filter((file) =>
            file.endsWith(".json")
          )
          .map((file) =>
            file.replace(".json", "")
          );

        return res.json({
          animations,
        });
      } catch (err) {
        console.error(
          "Failed to list animations:",
          err
        );

        return res.status(500).json({
          error:
            "Failed to list animations",
        });
      }
    }
  );

  router.get(
    "/:name",
    readLimiter,
    async (req, res) => {
      const { name } = req.params;

      if (!isValidSimpleName(name)) {
        return res.status(400).json({
          error:
            "Invalid animation name",
        });
      }

      try {
        const animationPath =
          await resolveSafeFilePath(
            resolvedAnimationDir,
            `${name}.json`
          );

        const data = await fs.readFile(
          animationPath,
          "utf8"
        );

        return res.json(
          JSON.parse(data)
        );
      } catch (err) {
        if (err.code === "ENOENT") {
          return res.status(404).json({
            error:
              "Animation not found",
          });
        }

        if (err.code === "INVALID_PATH") {
          return res.status(400).json({
            error:
              "Invalid animation name",
          });
        }

        console.error(
          "Failed to load animation:",
          err
        );

        return res.status(500).json({
          error:
            "Failed to load animation",
        });
      }
    }
  );

  return router;
}

export default createAnimationRouter();