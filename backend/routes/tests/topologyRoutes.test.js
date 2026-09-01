import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  createTopologyRouter,
} from "../topologyRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(
  __dirname,
  "testdata",
  "save",
  "topology.json"
);

let app;

beforeEach(() => {
  fs.rmSync(path.dirname(outputPath), {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true,
  });

  app = express();
  app.use(express.json());

  const noRateLimit = (req, res, next) => next();

  app.use(
    "/api/topology",
    createTopologyRouter(outputPath),
    noRateLimit
  );
});

describe("POST /api/topology/save", () => {
  beforeEach(() => {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  });

  it("saves the topology and returns success", async () => {
    const topology = {
      nodes: [
        {
          id: "pc1",
          type: "pc",
        },
      ],
      networks: [
        {
          id: "net1",
          subnet: "10.1.0.0/24",
        },
      ],
      links: [],
    };

    const response = await request(app)
      .post("/api/topology/save")
      .send(topology)
      .expect(200);

    expect(response.body.message).toBe("Saved");

    expect(fs.existsSync(outputPath)).toBe(true);

    const savedTopology = JSON.parse(
      fs.readFileSync(outputPath, "utf8")
    );

    expect(savedTopology).toEqual(topology);
  });

  it("preserves nested topology data", async () => {
    const topology = {
      nodes: [
        {
          id: "router1",
          data: {
            role: "router",
            ipAddresses: {
              net1: "10.1.0.2",
              net2: "10.2.0.2",
            },
          },
        },
      ],
      networks: [
        {
          id: "net1",
          nodes: ["router1"],
        },
      ],
      trafficFlows: [
        {
          source: "pc1",
          destination: "pc2",
          type: "icmp",
        },
      ],
    };

    await request(app)
      .post("/api/topology/save")
      .send(topology)
      .expect(200);

    const savedTopology = JSON.parse(
      fs.readFileSync(outputPath, "utf8")
    );

    expect(savedTopology).toEqual(topology);
  });
});

