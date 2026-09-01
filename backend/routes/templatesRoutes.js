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
      throw new Error("Invalid template name");
    }

    // Resolve the real location of the templates directory.
    const canonicalRoot = await fs.realpath(
      resolvedTemplateDir
    );

    const candidatePath = path.join(
      canonicalRoot,
      `${name}.json`
    );

    try {
      // If the file already exists, resolve symlinks too.
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
        throw new Error("Invalid template path");
      }

      return canonicalCandidate;
    } catch (err) {
      // A security/path error that we threw ourselves
      // should not be treated as "file doesn't exist".
      if (err.message === "Invalid template path") {
        throw err;
      }

      // For a new file, realpath fails because the file
      // doesn't exist yet. Since filenames cannot contain
      // directories, creating it directly under
      // canonicalRoot is safe.
      return candidatePath;
    }
  }

  const router = express.Router();

  router.get("/", listLimiter, async (req, res) => {
    try {
      const files = await fs.readdir(resolvedTemplateDir);

      const templates = files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""));

      res.json({ templates });
    } catch (err) {
      console.error("Failed to list templates", err);

      res.status(500).json({
        error: "Failed to list templates",
      });
    }
  });

  router.get("/:name", readLimiter, async (req, res) => {
    const name = req.params.name;

    let templatePath;

    try {
      templatePath = await resolveTemplatePath(name);
    } catch {
      return res.status(400).json({
        error: "Invalid template name",
      });
    }

    try {
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
      } catch {
        return res.status(400).json({
          error: "Invalid template name",
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
        path: templatePath,
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