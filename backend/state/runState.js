import { runs } from "./runs.js";

export function createRun(runId, data) {
  runs.set(runId, data);
}

export function getRun(runId) {
  return runs.get(runId);
}

export function updateRun(runId, patch) {
  const run = runs.get(runId);

  if (!run) {
    return;
  }

  Object.assign(run, patch);
}

export function addRunLog(runId, message) {
  const run = runs.get(runId);

  if (!run) {
    return;
  }

  const line =
    `[${new Date().toLocaleTimeString()}] ${message}`;

  run.logs.push(line);

  console.log(`[${runId}] ${message}`);
}