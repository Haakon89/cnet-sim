import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import {
  createTemplateRouter,
} from "../templatesRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.join(__dirname, "testdata", "templates");
const testTemplatePath = path.join(
  templateDir,
  "vitest-template.json"
);

const app = express();

app.use(express.json());

const noRateLimit = (req, res, next) => next();

app.use(
  "/api/templates",
  createTemplateRouter(
    templateDir,
    noRateLimit,
    noRateLimit
  )
);

describe("template routes", () => {
  beforeEach(async () => {
    await fs.mkdir(templateDir, {
      recursive: true,
    });

    try {
      await fs.unlink(testTemplatePath);
    } catch {
      // File does not exist, which is fine.
    }
  });

  afterEach(async () => {
    try {
      await fs.unlink(testTemplatePath);
    } catch {
      // File does not exist, which is fine.
    }
  });

  it("lists JSON templates", async () => {
    await fs.writeFile(
      testTemplatePath,
      JSON.stringify({ nodes: [] }),
      "utf8"
    );

    const response = await request(app)
      .get("/api/templates")
      .expect(200);

    expect(response.body.templates).toContain("vitest-template");
  });

  it("loads a template by name", async () => {
    const template = {
      nodes: [
        {
          id: "pc1",
          type: "pc",
        },
      ],
      networks: [],
    };

    await fs.writeFile(
      testTemplatePath,
      JSON.stringify(template),
      "utf8"
    );

    const response = await request(app)
      .get("/api/templates/vitest-template")
      .expect(200);

    expect(response.body).toEqual(template);
  });

  it("returns 404 when template does not exist", async () => {
    const response = await request(app)
      .get("/api/templates/does-not-exist")
      .expect(404);

    expect(response.body.error).toBe("Template not found");
  });

  it("rejects invalid template names", async () => {
    const response = await request(app)
      .get("/api/templates/bad$name")
      .expect(400);

    expect(response.body.error).toBe("Invalid template name");
  });

  it("saves a new template", async () => {
    const template = {
      nodes: [
        {
          id: "pc1",
          type: "pc",
        },
      ],
      networks: [],
    };

    const response = await request(app)
      .post("/api/templates/save")
      .send({
        name: "vitest-template",
        template,
      })
      .expect(200);

    expect(response.body.message).toBe("Saved");
    expect(response.body.name).toBe("vitest-template");

    const savedTemplate = JSON.parse(
      await fs.readFile(testTemplatePath, "utf8")
    );

    expect(savedTemplate).toEqual(template);
  });

  it("rejects missing name", async () => {
    const response = await request(app)
      .post("/api/templates/save")
      .send({
        template: { nodes: [] },
      })
      .expect(400);

    expect(response.body.error).toBe("Missing name or template");
  });

  it("rejects invalid template name when saving", async () => {
    const response = await request(app)
      .post("/api/templates/save")
      .send({
        name: "../bad-template",
        template: { nodes: [] },
      })
      .expect(400);

    expect(response.body.error).toBe("Invalid template name");
  });

  it("rejects duplicate template names", async () => {
    await fs.writeFile(
      testTemplatePath,
      JSON.stringify({ nodes: [] }),
      "utf8"
    );

    const response = await request(app)
      .post("/api/templates/save")
      .send({
        name: "vitest-template",
        template: { nodes: [] },
      })
      .expect(409);

    expect(response.body.error).toBe(
      "Template name already exists"
    );
  });
});