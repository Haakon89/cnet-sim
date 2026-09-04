import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";

import { runs } from "../runs.js";

import {
  createRun,
  getRun,
  updateRun,
  addRunLog,
} from "../runState.js";

describe("runState", () => {
  beforeEach(() => {
    runs.clear();
  });

  afterEach(() => {
    runs.clear();
    vi.restoreAllMocks();
  });

  it("creates and retrieves a run", () => {
    const run = {
      status: "active",
      logs: [],
    };

    createRun("run1", run);

    expect(getRun("run1")).toBe(run);
  });

  it("returns undefined for an unknown run", () => {
    expect(getRun("missing")).toBeUndefined();
  });

  it("updates an existing run", () => {
    createRun("run1", {
      status: "active",
      step: "queued",
      logs: [],
    });

    updateRun("run1", {
      step: "running",
    });

    expect(getRun("run1").step).toBe(
      "running"
    );
  });

  it("does nothing when updating an unknown run", () => {
    expect(() => {
      updateRun("missing", {
        step: "running",
      });
    }).not.toThrow();

    expect(getRun("missing")).toBeUndefined();
  });

  it("adds a log entry to a run", () => {
    createRun("run1", {
      logs: [],
    });

    vi.spyOn(console, "log")
      .mockImplementation(() => {});

    addRunLog("run1", "Environment started");

    const run = getRun("run1");

    expect(run.logs).toHaveLength(1);

    expect(run.logs[0]).toContain(
      "Environment started"
    );
  });

  it("writes the message to the console", () => {
    createRun("run1", {
      logs: [],
    });

    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});

    addRunLog("run1", "Test message");

    expect(consoleSpy).toHaveBeenCalledWith(
      "[run1] Test message"
    );
  });

  it("does nothing when logging to an unknown run", () => {
    expect(() => {
      addRunLog("missing", "Test");
    }).not.toThrow();
  });
});