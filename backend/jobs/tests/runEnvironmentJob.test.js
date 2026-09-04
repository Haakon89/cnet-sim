import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";

import { EventEmitter } from "events";

import {
  createEnvironmentJobs,
} from "../runEnvironmentJob.js";

import { runs } from "../../state/runs.js";

function createFakeChild() {
  const child = new EventEmitter();

  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();

  return child;
}

function flushPromises() {
  return new Promise((resolve) =>
    setImmediate(resolve)
  );
}

describe("runEnvironmentJob", () => {
  beforeEach(() => {
    runs.clear();
  });

  afterEach(() => {
    runs.clear();
    vi.restoreAllMocks();
  });

  it("runs converter and runner successfully", async () => {
    runs.set("run1", {
      status: "active",
      step: "queued",
      logs: [],
      interactive: false,
      durationSeconds: 30,
      process: null,
    });

    const execFileFn = vi.fn().mockResolvedValue({
      stdout: "services:\n  pc1:\n",
    });

    const child = createFakeChild();

    const spawnFn = vi.fn(() => child);

    const fsModule = {
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };

    const { runEnvironmentJob } =
      createEnvironmentJobs({
        execFileFn,
        spawnFn,
        fsModule,
        rootDir: "/test/backend",
      });

    const jobPromise =
      runEnvironmentJob("run1");

    await flushPromises();

    child.stdout.emit(
      "data",
      "[+] Environment running\n"
    );

    child.emit("close", 0);

    await jobPromise;

    const run = runs.get("run1");

    expect(run.status).toBe("finished");
    expect(run.step).toBe("finished");
    expect(run.finishedAt).toEqual(
      expect.any(Number)
    );

    expect(execFileFn).toHaveBeenCalledWith(
      "go",
      [
        "run",
        ".",
        "/test/backend/converter/json_files/topology.json",
      ],
      {
        cwd: "/test/backend/converter",
      }
    );

    expect(
      fsModule.mkdirSync
    ).toHaveBeenCalledWith(
      "/test/backend/converter/yml_files",
      {
        recursive: true,
      }
    );

    expect(
      fsModule.mkdirSync
    ).toHaveBeenCalledWith(
      "/test/backend/results",
      {
        recursive: true,
      }
    );

    expect(
      fsModule.writeFileSync
    ).toHaveBeenCalledWith(
      "/test/backend/converter/yml_files/docker-compose.yml",
      "services:\n  pc1:\n"
    );

    expect(spawnFn).toHaveBeenCalledWith(
      "/test/backend/runner/runner",
      [
        "--compose",
        "/test/backend/converter/yml_files/docker-compose.yml",
        "--output",
        "/test/backend/results",
        "--duration",
        "30s",
      ],
      expect.objectContaining({
        cwd: "/test/backend/runner",
      })
    );
  });

  it("uses interactive runner mode", async () => {
    runs.set("run1", {
      status: "active",
      step: "queued",
      logs: [],
      interactive: true,
      durationSeconds: 30,
      process: null,
    });

    const child = createFakeChild();

    const spawnFn = vi.fn(() => child);

    const { runEnvironmentJob } =
      createEnvironmentJobs({
        execFileFn: vi.fn().mockResolvedValue({
          stdout: "services: {}\n",
        }),
        spawnFn,
        fsModule: {
          mkdirSync: vi.fn(),
          writeFileSync: vi.fn(),
        },
        rootDir: "/test/backend",
      });

    const promise =
      runEnvironmentJob("run1");

    await flushPromises();

    child.emit("close", 0);

    await promise;

    const args = spawnFn.mock.calls[0][1];

    expect(args).toContain("--interactive");
    expect(args).not.toContain("--duration");
  });

  it("marks the run as failed when converter fails", async () => {
    runs.set("run1", {
      status: "active",
      step: "queued",
      logs: [],
      interactive: false,
      durationSeconds: 30,
      process: null,
    });

    const execFileFn =
      vi.fn().mockRejectedValue(
        new Error("converter failed")
      );

    const { runEnvironmentJob } =
      createEnvironmentJobs({
        execFileFn,
        spawnFn: vi.fn(),
        fsModule: {
          mkdirSync: vi.fn(),
          writeFileSync: vi.fn(),
        },
        rootDir: "/test/backend",
      });

    await runEnvironmentJob("run1");

    const run = runs.get("run1");

    expect(run.status).toBe("failed");
    expect(run.step).toBe("failed");
    expect(run.finishedAt).toEqual(
      expect.any(Number)
    );
    expect(run.error).toBe(
      "converter failed"
    );
  });

  it("marks the run as failed when runner exits non-zero", async () => {
    runs.set("run1", {
      status: "active",
      step: "queued",
      logs: [],
      interactive: false,
      durationSeconds: 30,
      process: null,
    });

    const child = createFakeChild();

    const { runEnvironmentJob } =
      createEnvironmentJobs({
        execFileFn: vi.fn().mockResolvedValue({
          stdout: "services: {}\n",
        }),
        spawnFn: vi.fn(() => child),
        fsModule: {
          mkdirSync: vi.fn(),
          writeFileSync: vi.fn(),
        },
        rootDir: "/test/backend",
      });

    const promise =
      runEnvironmentJob("run1");

    await flushPromises();

    child.emit("close", 1);

    await promise;

    const run = runs.get("run1");

    expect(run.status).toBe("failed");
    expect(run.step).toBe("failed");
    expect(run.finishedAt).toEqual(
      expect.any(Number)
    );
    expect(run.error).toContain(
      "exited with code 1"
    );
  });

  it("updates run steps from runner output", async () => {
    runs.set("run1", {
      status: "active",
      step: "queued",
      logs: [],
      interactive: false,
      durationSeconds: 30,
      process: null,
    });

    const child = createFakeChild();

    const { runEnvironmentJob } =
      createEnvironmentJobs({
        execFileFn: vi.fn().mockResolvedValue({
          stdout: "services: {}\n",
        }),
        spawnFn: vi.fn(() => child),
        fsModule: {
          mkdirSync: vi.fn(),
          writeFileSync: vi.fn(),
        },
        rootDir: "/test/backend",
      });

    const promise =
      runEnvironmentJob("run1");

    await flushPromises();

    child.stdout.emit(
      "data",
      "[+] Starting environment\n"
    );

    expect(
      runs.get("run1").step
    ).toBe("building");

    child.stdout.emit(
      "data",
      "[+] Environment running\n"
    );

    expect(
      runs.get("run1").step
    ).toBe("running");

    expect(
      runs.get("run1").runningStartedAt
    ).toEqual(expect.any(Number));

    child.stdout.emit(
      "data",
      "[+] Collecting router files\n"
    );

    expect(
      runs.get("run1").step
    ).toBe("collecting");

    child.stdout.emit(
      "data",
      "[+] Removing environment\n"
    );

    expect(
      runs.get("run1").step
    ).toBe("shutting_down");

    child.emit("close", 0);

    await promise;
  });

  it("stores and clears the active child process", async () => {
    runs.set("run1", {
      status: "active",
      step: "queued",
      logs: [],
      interactive: false,
      durationSeconds: 30,
      process: null,
    });

    const child = createFakeChild();

    const { runEnvironmentJob } =
      createEnvironmentJobs({
        execFileFn: vi.fn().mockResolvedValue({
          stdout: "services: {}\n",
        }),
        spawnFn: vi.fn(() => child),
        fsModule: {
          mkdirSync: vi.fn(),
          writeFileSync: vi.fn(),
        },
        rootDir: "/test/backend",
      });

    const promise =
      runEnvironmentJob("run1");

    await flushPromises();

    expect(
      runs.get("run1").process
    ).toBe(child);

    child.emit("close", 0);

    await promise;

    expect(
      runs.get("run1").process
    ).toBeNull();
  });
});

describe("stopEnvironmentJob", () => {
  beforeEach(() => {
    runs.clear();
  });

  afterEach(() => {
    runs.clear();
    vi.restoreAllMocks();
  });

  it("returns false when the run does not exist", () => {
    const { stopEnvironmentJob } =
      createEnvironmentJobs();

    expect(
      stopEnvironmentJob("missing")
    ).toBe(false);
  });

  it("returns false when there is no active process", () => {
    runs.set("run1", {
      logs: [],
      process: null,
    });

    const { stopEnvironmentJob } =
      createEnvironmentJobs();

    expect(
      stopEnvironmentJob("run1")
    ).toBe(false);
  });

  it("kills the process with SIGTERM", () => {
    const process = {
      kill: vi.fn(),
    };

    runs.set("run1", {
      logs: [],
      process,
      step: "running",
    });

    const { stopEnvironmentJob } =
      createEnvironmentJobs();

    const result =
      stopEnvironmentJob("run1");

    expect(result).toBe(true);

    expect(
      process.kill
    ).toHaveBeenCalledWith("SIGTERM");

    expect(
      runs.get("run1").step
    ).toBe("stopping");
  });
});