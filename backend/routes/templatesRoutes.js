import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TEMPLATE_DIR = path.join(
  __dirname,
  "..",
  "templates"
);

export function createTemplateRouter(
  templateDir = DEFAULT_TEMPLATE_DIR
) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const files = await fs.readdir(templateDir);

      const templates = files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""));

      res.json({ templates });
    } catch (err) {
      console.error("Failed to list templates:", err);
      res.status(500).json({
        error: "Failed to list templates",
      });
    }
  });

  router.get("/:name", async (req, res) => {
    try {
      const name = req.params.name;

      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return res.status(400).json({
          error: "Invalid template name",
        });
      }

      const templatePath = path.join(
        templateDir,
        `${name}.json`
      );

      const data = await fs.readFile(
        templatePath,
        "utf8"
      );

      res.json(JSON.parse(data));
    } catch (err) {
      console.error(
        "Failed to load template:",
        err
      );

      res.status(404).json({
        error: "Template not found",
      });
    }
  });

  router.post("/save", async (req, res) => {
    try {
      console.log(
        "Received template save request"
      );

      const { name, template } = req.body;

      if (!name || !template) {
        return res.status(400).json({
          error: "Missing name or template",
        });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return res.status(400).json({
          error: "Invalid template name",
        });
      }

      const templatePath = path.join(
        templateDir,
        `${name}.json`
      );

      try {
        await fs.access(templatePath);

        return res.status(409).json({
          error: "Template name already exists",
        });
      } catch {
        // File does not exist, so it can be created.
      }

      await fs.writeFile(
        templatePath,
        JSON.stringify(template, null, 2),
        "utf8"
      );

      res.json({
        message: "Saved",
        name,
        path: templatePath,
      });
    } catch (err) {
      console.error(
        "Failed to save template:",
        err
      );

      res.status(500).json({
        error: "Failed to save template",
      });
    }
  });

  return router;
}

export default createTemplateRouter();