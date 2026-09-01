import express from "express";
import rateLimit from "express-rate-limit";
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

const templatesListLimiter = rateLimit({
  windowMs: 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const templatesReadLimiter = rateLimit({
  windowMs: 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const templatesSaveLimiter = rateLimit({
  windowMs: 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createTemplateRouter(
  templateDir = DEFAULT_TEMPLATE_DIR,
  listLimiter = templatesListLimiter,
  readLimiter = templatesReadLimiter,
  saveLimiter = templatesSaveLimiter
) {
  const resolvedTemplateDir = path.resolve(templateDir);

  async function resolveTemplatePath(name) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      const err = new Error("Invalid template name");
      err.code = "INVALID_TEMPLATE_PATH";
      throw err;
    }

    const canonicalRoot = await fs.realpath(
      resolvedTemplateDir
    );

    const candidatePath = path.join(
      canonicalRoot,
      `${name}.json`
    );

    try {
      // Existing files may be symbolic links, so resolve
      // their real filesystem location before using them.
      const canonicalCandidate =
        await fs.realpath(candidatePath);

      const rootWithSep =
        canonicalRoot.endsWith(path.sep)
          ? canonicalRoot
          : canonicalRoot + path.sep;

      if (
        canonicalCandidate !== canonicalRoot &&
        !canonicalCandidate.startsWith(rootWithSep)
      ) {
        const err = new Error("Invalid template path");
        err.code = "INVALID_TEMPLATE_PATH";
        throw err;
      }

      return canonicalCandidate;
    } catch (err) {
      if (err.code === "INVALID_TEMPLATE_PATH") {
        throw err;
      }

      // A new template will not exist yet.
      // Because template names cannot contain path
      // separators, it is safe to create directly
      // under canonicalRoot.
      if (err.code === "ENOENT") {
        return candidatePath;
      }

      // Permission errors, I/O errors, etc. are genuine
      // filesystem failures and should not be treated as
      // "file does not exist".
      throw err;
    }
  }

  const router = express.Router();

  router.get("/", listLimiter, async (req, res) => {
    try {
      const canonicalRoot =
        await fs.realpath(resolvedTemplateDir);

      const files = await fs.readdir(canonicalRoot);

      const templates = files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""));

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
  });

  router.get("/:name", readLimiter, async (req, res) => {
    const name = req.params.name;

    let templatePath;

    try {
      templatePath = await resolveTemplatePath(name);
    } catch (err) {
      if (err.code === "INVALID_TEMPLATE_PATH") {
        return res.status(400).json({
          error: "Invalid template name",
        });
      }

      console.error(
        "Failed to resolve template path:",
        err
      );

      return res.status(500).json({
        error: "Failed to access template storage",
      });
    }

    try {
      const data = await fs.readFile(
        templatePath,
        "utf8"
      );

      return res.json(JSON.parse(data));
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.status(404).json({
          error: "Template not found",
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
  });

  router.post("/save", saveLimiter, async (req, res) => {
    try {
      const { name, template } = req.body;

      if (!name || !template) {
        return res.status(400).json({
          error: "Missing name or template",
        });
      }

      let templatePath;

      try {
        templatePath = await resolveTemplatePath(name);
      } catch (err) {
        if (err.code === "INVALID_TEMPLATE_PATH") {
          return res.status(400).json({
            error: "Invalid template name",
          });
        }

        console.error(
          "Failed to resolve template path:",
          err
        );

        return res.status(500).json({
          error: "Failed to access template storage",
        });
      }

      try {
        await fs.writeFile(
          templatePath,
          JSON.stringify(template, null, 2),
          {
            encoding: "utf8",
            flag: "wx",
          }
        );
      } catch (err) {
        if (err.code === "EEXIST") {
          return res.status(409).json({
            error: "Template name already exists",
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
        error: "Failed to save template",
      });
    }
  });

  return router;
}

export default createTemplateRouter();