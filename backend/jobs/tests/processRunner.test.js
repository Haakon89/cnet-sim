import {
  describe,
  it,
  expect,
  vi,
} from "vitest";

import { EventEmitter } from "events";

import {
  runSpawnedCommand,
} from "../processRunner.js";

function createFakeChild() {
  const child = new EventEmitter();

  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();

  return child;
}

describe("runSpawnedCommand", () => {
  it("spawns the command with shell disabled", async () => {
    const child = createFakeChild();
    const spawnFn = vi.fn(() => child);

    const promise = runSpawnedCommand({
      command: "test-command",
      args: ["--foo", "bar"],
      spawnFn,
      options: {
        cwd: "/test",
      },
    });

    child.emit("close", 0);

    await promise;

    expect(spawnFn).toHaveBeenCalledWith(
      "test-command",
      ["--foo", "bar"],
      {
        cwd: "/test",
        shell: false,
      }
    );
  });

  it("passes the child process to onProcess", async () => {
    const child = createFakeChild();
    const onProcess = vi.fn();

    const promise = runSpawnedCommand({
      command: "test-command",
      args: [],
      spawnFn: vi.fn(() => child),
      onProcess,
    });

    child.emit("close", 0);

    await promise;

    expect(onProcess).toHaveBeenCalledWith(
      child
    );
  });

  it("passes stdout lines to onStdout", async () => {
    const child = createFakeChild();
    const onStdout = vi.fn();

    const promise = runSpawnedCommand({
      command: "test-command",
      args: [],
      spawnFn: vi.fn(() => child),
      onStdout,
    });

    child.stdout.emit(
      "data",
      "first line\nsecond line\n"
    );

    child.emit("close", 0);

    await promise;

    expect(onStdout).toHaveBeenCalledWith(
      "first line"
    );

    expect(onStdout).toHaveBeenCalledWith(
      "second line"
    );
  });

  it("passes stderr lines to onStderr", async () => {
    const child = createFakeChild();
    const onStderr = vi.fn();

    const promise = runSpawnedCommand({
      command: "test-command",
      args: [],
      spawnFn: vi.fn(() => child),
      onStderr,
    });

    child.stderr.emit(
      "data",
      "something went wrong\n"
    );

    child.emit("close", 0);

    await promise;

    expect(onStderr).toHaveBeenCalledWith(
      "something went wrong"
    );
  });

  it("calls onClose when the process closes", async () => {
    const child = createFakeChild();
    const onClose = vi.fn();

    const promise = runSpawnedCommand({
      command: "test-command",
      args: [],
      spawnFn: vi.fn(() => child),
      onClose,
    });

    child.emit("close", 0);

    await promise;

    expect(onClose).toHaveBeenCalledWith(0);
  });

  it("rejects when the command exits non-zero", async () => {
    const child = createFakeChild();

    const promise = runSpawnedCommand({
      command: "test-command",
      args: [],
      spawnFn: vi.fn(() => child),
    });

    child.emit("close", 1);

    await expect(promise).rejects.toThrow(
      "test-command exited with code 1"
    );
  });

  it("rejects when the child process emits an error", async () => {
    const child = createFakeChild();

    const promise = runSpawnedCommand({
      command: "test-command",
      args: [],
      spawnFn: vi.fn(() => child),
    });

    child.emit(
      "error",
      new Error("spawn failed")
    );

    await expect(promise).rejects.toThrow(
      "spawn failed"
    );
  });
});