import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createResultsRouter } from "../resultsRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resultsDir = path.join(__dirname, "testdata", "results");

const app = express();

app.use(
  "/api/results",
  createResultsRouter(resultsDir)
);

describe("results routes", () => {
  beforeEach(() => {
    fs.rmSync(resultsDir, {
      recursive: true,
      force: true,
    });

    fs.mkdirSync(resultsDir, {
      recursive: true,
    });
  });

  afterEach(() => {
    fs.rmSync(resultsDir, {
      recursive: true,
      force: true,
    });
  });

  it("returns an empty array when no result files exist", async () => {
    const response = await request(app)
      .get("/api/results")
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("lists files recursively", async () => {
    const nestedDir = path.join(resultsDir, "run1");

    fs.mkdirSync(nestedDir, {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(nestedDir, "capture.txt"),
      "packet data"
    );

    const response = await request(app)
      .get("/api/results")
      .expect(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      name: "capture.txt",
      relativePath: path.join("run1", "capture.txt"),
    });

    expect(response.body[0].size).toBeGreaterThan(0);
  });

  it("returns 400 when download path is missing", async () => {
    const response = await request(app)
      .get("/api/results/download")
      .expect(400);

    expect(response.text).toBe("Missing file path");
  });

  it("rejects path traversal attempts", async () => {
    const response = await request(app)
      .get("/api/results/download")
      .query({
        path: "../secret.txt",
      })
      .expect(400);

    expect(response.text).toBe("Invalid path");
  });

  it("returns 404 when requested file does not exist", async () => {
    const response = await request(app)
      .get("/api/results/download")
      .query({
        path: "missing.txt",
      })
      .expect(404);

    expect(response.text).toBe("File not found");
  });

  it("downloads an existing result file", async () => {
    const filePath = path.join(
      resultsDir,
      "capture.txt"
    );

    fs.writeFileSync(filePath, "packet data");

    const response = await request(app)
      .get("/api/results/download")
      .query({
        path: "capture.txt",
      })
      .expect(200);

    expect(response.text).toBe("packet data");
  });
});