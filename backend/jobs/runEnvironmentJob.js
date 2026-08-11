import fs from "fs";
import path from "path";
import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

import { runs } from "../state/runs.js";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, "..");


function updateRun(runId, patch) {
  const run = runs.get(runId);
  if (!run) return;
  Object.assign(run, patch);
}

function addLog(runId, message) {
  const run = runs.get(runId);
  if (!run) return;

  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  run.logs.push(line);
  console.log(`[${runId}] ${message}`);
}

function runSpawnedCommand(runId, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: false,
    });

    updateRun(runId, { process: child });

    child.stdout.on("data", (data) => {
      const lines = data.toString().split(/\r?\n/).filter(Boolean);

      for (const line of lines) {
        addLog(runId, line);

        if (line.includes("[+] Starting environment")) {
          updateRun(runId, { step: "building" });
        }

        if (line.includes("[+] Environment running")) {
          updateRun(runId, {
            step: "running",
            runningStartedAt: Date.now(),
          });
        }

        if (line.includes("[+] Collecting router files")) {
          updateRun(runId, { step: "collecting" });
        }

        if (line.includes("[+] Removing environment")) {
          updateRun(runId, { step: "shutting_down" });
        }
      }
    });

    child.stderr.on("data", (data) => {
      const lines = data.toString().split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        addLog(runId, `[stderr] ${line}`);
      }
    });

    child.on("error", reject);

    child.on("close", (code) => {
      updateRun(runId, { process: null });

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

export async function runEnvironmentJob(runId) {
  const run = runs.get(runId);
  if (!run) return;

  try {
    const converterDir = path.join(backendRoot, "converter");
    const runnerDir = path.join(backendRoot, "runner");

    const topologyPath = path.join(
      converterDir,
      "json_files",
      "topology.json"
    );

    const composePath = path.join(
      converterDir,
      "yml_files",
      "docker-compose.yml"
    );

    updateRun(runId, { composePath });

    const resultsDir = path.join(backendRoot, "results");

    fs.mkdirSync(path.dirname(composePath), { recursive: true });
    fs.mkdirSync(resultsDir, { recursive: true });

    updateRun(runId, { status: "active", step: "converting" });
    addLog(runId, "Converting topology JSON to docker-compose.yml");

    const converterResult = await execFileAsync(
      "go",
      ["run", ".", topologyPath],
      { cwd: converterDir }
    );

    fs.writeFileSync(composePath, converterResult.stdout);

    addLog(runId, "docker-compose.yml created");

    updateRun(runId, { step: "building" });
    addLog(runId, "Starting Docker environment");

    const runnerCommand = path.join(runnerDir, "runner");

    const runnerArgs = [
      "--compose",
      composePath,
      "--output",
      resultsDir,
    ];

    if (run.interactive) {
      runnerArgs.push("--interactive");
    } else {
      runnerArgs.push("--duration", `${run.durationSeconds}s`);
    }

    await runSpawnedCommand(runId, runnerCommand, runnerArgs, {
      cwd: runnerDir,
    });

    updateRun(runId, {
      status: "finished",
      step: "finished",
      finishedAt: Date.now(),
    });

    addLog(runId, "Finished");
  } catch (error) {
    updateRun(runId, {
      status: "failed",
      step: "failed",
      finishedAt: Date.now(),
      error: error.message ?? String(error),
    });

    addLog(runId, `Failed: ${error.message ?? error}`);
  }
}

export function stopEnvironmentJob(runId) {
  const run = runs.get(runId);

  if (!run?.process) {
    return false;
  }

  addLog(runId, "Stopping interactive environment");

  run.process.kill("SIGTERM");

  updateRun(runId, {
    step: "stopping",
  });

  return true;
}