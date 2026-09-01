import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";

import express from "express";
import request from "supertest";

import { createInteractiveRouter } from "../interactiveRoutes.js";
import { runs } from "../../state/runs.js";

describe("interactive routes", () => {
  beforeEach(() => {
    runs.clear();
  });

  afterEach(() => {
    runs.clear();
  });

  it("returns 404 when run does not exist", async () => {
    const execFileMock = vi.fn();

    const app = express();
    const noRateLimit = (req, res, next) => next();
    app.use(
      "/api/interactive",
      createInteractiveRouter(execFileMock, noRateLimit)
    );

    const response = await request(app)
      .get("/api/interactive/unknown-run/containers")
      .expect(404);

    expect(response.body).toEqual({
      error: "Run not found",
    });

    expect(execFileMock).not.toHaveBeenCalled();
  });

  it("returns 400 when compose file is not ready", async () => {
    runs.set("run1", {
      status: "starting",
    });

    const execFileMock = vi.fn();

    const app = express();

    app.use(
      "/api/interactive",
      createInteractiveRouter(execFileMock)
    );

    const response = await request(app)
      .get("/api/interactive/run1/containers")
      .expect(400);

    expect(response.body).toEqual({
      error: "Compose file not ready yet",
    });

    expect(execFileMock).not.toHaveBeenCalled();
  });

  it("returns containers from docker compose", async () => {
    runs.set("run1", {
      composePath: "/tmp/docker-compose.yml",
    });

    const execFileMock = vi.fn(
      (command, args, callback) => {
        const stdout =
          '{"Name":"pc1","Service":"pc1","State":"running"}\n' +
          '{"Name":"router1","Service":"router1","State":"running"}\n';

        callback(null, stdout);
      }
    );

    const app = express();

    app.use(
      "/api/interactive",
      createInteractiveRouter(execFileMock)
    );

    const response = await request(app)
      .get("/api/interactive/run1/containers")
      .expect(200);

    expect(response.body).toEqual({
      containers: [
        {
          name: "pc1",
          service: "pc1",
          state: "running",
        },
        {
          name: "router1",
          service: "router1",
          state: "running",
        },
      ],
    });
  });

  it("calls docker with the correct arguments", async () => {
    runs.set("run1", {
      composePath: "/tmp/docker-compose.yml",
    });

    const execFileMock = vi.fn(
      (command, args, callback) => {
        callback(null, "");
      }
    );

    const app = express();

    app.use(
      "/api/interactive",
      createInteractiveRouter(execFileMock)
    );

    await request(app)
      .get("/api/interactive/run1/containers")
      .expect(200);

    expect(execFileMock).toHaveBeenCalledWith(
      "docker",
      [
        "compose",
        "-p",
        "netsim_test",
        "-f",
        "/tmp/docker-compose.yml",
        "ps",
        "--format",
        "json",
      ],
      expect.any(Function)
    );
  });

  it("returns 500 when docker command fails", async () => {
    runs.set("run1", {
      composePath: "/tmp/docker-compose.yml",
    });

    const execFileMock = vi.fn(
      (command, args, callback) => {
        callback(
          new Error("Docker is not running"),
          ""
        );
      }
    );

    const app = express();

    app.use(
      "/api/interactive",
      createInteractiveRouter(execFileMock)
    );

    const response = await request(app)
      .get("/api/interactive/run1/containers")
      .expect(500);

    expect(response.body).toEqual({
      error: "Docker is not running",
    });
  });

  it("returns an empty array when docker returns no containers", async () => {
    runs.set("run1", {
      composePath: "/tmp/docker-compose.yml",
    });

    const execFileMock = vi.fn(
      (command, args, callback) => {
        callback(null, "");
      }
    );

    const app = express();

    app.use(
      "/api/interactive",
      createInteractiveRouter(execFileMock)
    );

    const response = await request(app)
      .get("/api/interactive/run1/containers")
      .expect(200);

    expect(response.body).toEqual({
      containers: [],
    });
  });
});