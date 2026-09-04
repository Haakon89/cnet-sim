import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import {
  standardReadLimiter,
  standardWriteLimiter,
} from "../security/rateLimiters.js";

import {
  isValidSimpleName,
  assertValidSimpleName,
  resolveSafeFilePath,
} from "../security/pathSecurity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TEMPLATE_DIR = path.join(
  __dirname,
  "..",
  "templates"
);

export function createTemplateRouter(
  templateDir = DEFAULT_TEMPLATE_DIR,
  listLimiter = standardReadLimiter,
  readLimiter = standardReadLimiter,
  saveLimiter = standardWriteLimiter
) {
  const resolvedTemplateDir =
    path.resolve(templateDir);

  async function resolveTemplatePath(name) {
    assertValidSimpleName(name);

    return resolveSafeFilePath(
      resolvedTemplateDir,
      `${name}.json`
    );
  }

  async function saveTemplateFile(
    name,
    template
  ) {
    const templatePath =
      await resolveTemplatePath(name);

    await fs.writeFile(
      templatePath,
      JSON.stringify(template, null, 2),
      {
        encoding: "utf8",
        flag: "wx",
      }
    );
  }

  const router = express.Router();

  router.get(
    "/",
    listLimiter,
    async (req, res) => {
      try {
        const canonicalRoot =
          await fs.realpath(
            resolvedTemplateDir
          );

        const files =
          await fs.readdir(canonicalRoot);

        const templates = files
          .filter((file) =>
            file.endsWith(".json")
          )
          .map((file) =>
            file.replace(".json", "")
          );

        return res.json({ templates });
      } catch (err) {
        console.error(
          "Failed to list templates:",
          err
        );

        return res.status(500).json({
          error: "Failed to list templates",
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
          error: "Invalid template name",
        });
      }

      try {
        const templatePath =
          await resolveTemplatePath(name);

        const data = await fs.readFile(
          templatePath,
          "utf8"
        );

        return res.json(
          JSON.parse(data)
        );
      } catch (err) {
        if (err.code === "ENOENT") {
          return res.status(404).json({
            error: "Template not found",
          });
        }

        if (err.code === "INVALID_PATH") {
          return res.status(400).json({
            error: "Invalid template name",
          });
        }

        console.error(
          "Failed to load template:",
          err
        );

        return res.status(500).json({
          error: "Failed to load template",
        });
      }
    }
  );

  router.post(
    "/save",
    saveLimiter,
    async (req, res) => {
      try {
        const { name, template } =
          req.body;

        if (!name || !template) {
          return res.status(400).json({
            error:
              "Missing name or template",
          });
        }

        try {
          await saveTemplateFile(
            name,
            template
          );
        } catch (err) {
          if (
            err.code === "INVALID_PATH"
          ) {
            return res.status(400).json({
              error:
                "Invalid template name",
            });
          }

          if (err.code === "EEXIST") {
            return res.status(409).json({
              error:
                "Template name already exists",
            });
          }

          throw err;
        }

        return res.json({
          message: "Saved",
          name,
        });
      } catch (err) {
        console.error(
          "Failed to save template:",
          err
        );

        return res.status(500).json({
          error:
            "Failed to save template",
        });
      }
    }
  );

  return router;
}

export default createTemplateRouter();