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

import {
  createEnvironmentRouter,
} from "../environmentRoutes.js";

import { runs } from "../../state/runs.js";

describe("environment routes", () => {
  beforeEach(() => {
    runs.clear();
  });

  afterEach(() => {
    runs.clear();
  });

  it("creates a new run", async () => {
    const runJob = vi.fn();
    const stopJob = vi.fn();

    const app = express();
    app.use(express.json());

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob,
        stopJob,
        createRunId: () => "test-run-1",
      })
    );

    const response = await request(app)
      .post("/api/environment/run")
      .send({
        durationSeconds: 30,
        interactive: true,
      })
      .expect(200);

    expect(response.body).toEqual({
      runId: "test-run-1",
    });

    expect(runJob).toHaveBeenCalledWith(
      "test-run-1"
    );
  });

  it("stores the run with the correct values", async () => {
    const app = express();
    app.use(express.json());

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob: vi.fn(),
        createRunId: () => "test-run-1",
      })
    );

    await request(app)
      .post("/api/environment/run")
      .send({
        durationSeconds: 30,
        interactive: true,
      })
      .expect(200);

    const run = runs.get("test-run-1");

    expect(run).toMatchObject({
      status: "active",
      step: "queued",
      durationSeconds: 30,
      interactive: true,
      runningStartedAt: null,
      process: null,
      composePath: null,
      finishedAt: null,
      error: null,
    });

    expect(run.logs).toEqual([]);
    expect(run.startedAt).toEqual(
      expect.any(Number)
    );
  });

  it("uses 60 seconds by default", async () => {
    const app = express();
    app.use(express.json());

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob: vi.fn(),
        createRunId: () => "test-run-1",
      })
    );

    await request(app)
      .post("/api/environment/run")
      .send({})
      .expect(200);

    expect(
      runs.get("test-run-1").durationSeconds
    ).toBe(60);
  });

  it("clamps duration to a minimum of 1 second", async () => {
    const app = express();
    app.use(express.json());

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob: vi.fn(),
        createRunId: () => "test-run-1",
      })
    );

    await request(app)
      .post("/api/environment/run")
      .send({
        durationSeconds: -10,
      })
      .expect(200);

    expect(
      runs.get("test-run-1").durationSeconds
    ).toBe(1);
  });

  it("clamps duration to a maximum of 120 seconds", async () => {
    const app = express();
    app.use(express.json());

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob: vi.fn(),
        createRunId: () => "test-run-1",
      })
    );

    await request(app)
      .post("/api/environment/run")
      .send({
        durationSeconds: 999,
      })
      .expect(200);

    expect(
      runs.get("test-run-1").durationSeconds
    ).toBe(120);
  });

  it("only enables interactive mode for true", async () => {
    const app = express();
    app.use(express.json());

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob: vi.fn(),
        createRunId: () => "test-run-1",
      })
    );

    await request(app)
      .post("/api/environment/run")
      .send({
        interactive: "true",
      })
      .expect(200);

    expect(
      runs.get("test-run-1").interactive
    ).toBe(false);
  });

  it("returns run status", async () => {
    runs.set("test-run-1", {
      status: "active",
      step: "running",
      durationSeconds: 30,
    });

    const app = express();

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob: vi.fn(),
      })
    );

    const response = await request(app)
      .get(
        "/api/environment/status/test-run-1"
      )
      .expect(200);

    expect(response.body).toEqual({
      status: "active",
      step: "running",
      durationSeconds: 30,
    });
  });

  it("returns 404 for unknown run status", async () => {
    const app = express();

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob: vi.fn(),
      })
    );

    const response = await request(app)
      .get(
        "/api/environment/status/missing-run"
      )
      .expect(404);

    expect(response.body).toEqual({
      error: "Run not found",
    });
  });

  it("stops a running environment", async () => {
    const stopJob = vi.fn(() => true);

    const app = express();

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob,
      })
    );

    const response = await request(app)
      .post(
        "/api/environment/stop/test-run-1"
      )
      .expect(200);

    expect(stopJob).toHaveBeenCalledWith(
      "test-run-1"
    );

    expect(response.body).toEqual({
      ok: true,
    });
  });

  it("returns 404 when stop fails", async () => {
    const stopJob = vi.fn(() => false);

    const app = express();

    app.use(
      "/api/environment",
      createEnvironmentRouter({
        runJob: vi.fn(),
        stopJob,
      })
    );

    const response = await request(app)
      .post(
        "/api/environment/stop/missing-run"
      )
      .expect(404);

    expect(response.body).toEqual({
      error: "No running environment found",
    });
  });
});