import fs from "fs";
import path from "path";
import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

import {
  getRun,
  updateRun,
  addRunLog,
} from "../state/runState.js";

import {
  runSpawnedCommand,
} from "./processRunner.js";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendRoot =
  path.join(__dirname, "..");

export function createEnvironmentJobs({
  execFileFn = execFileAsync,
  spawnFn = spawn,
  fsModule = fs,
  rootDir = backendRoot,
} = {}) {

  function handleRunnerOutput(
    runId,
    line
  ) {
    addRunLog(runId, line);

    if (
      line.includes(
        "[+] Starting environment"
      )
    ) {
      updateRun(runId, {
        step: "building",
      });
    }

    if (
      line.includes(
        "[+] Environment running"
      )
    ) {
      updateRun(runId, {
        step: "running",
        runningStartedAt: Date.now(),
      });
    }

    if (
      line.includes(
        "[+] Collecting router files"
      )
    ) {
      updateRun(runId, {
        step: "collecting",
      });
    }

    if (
      line.includes(
        "[+] Removing environment"
      )
    ) {
      updateRun(runId, {
        step: "shutting_down",
      });
    }
  }

  async function runEnvironmentJob(runId) {
    const run = getRun(runId);

    if (!run) {
      return;
    }

    try {
      const converterDir = path.join(
        rootDir,
        "converter"
      );

      const runnerDir = path.join(
        rootDir,
        "runner"
      );

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

      const resultsDir = path.join(
        rootDir,
        "results"
      );

      updateRun(runId, {
        composePath,
        status: "active",
        step: "converting",
      });

      fsModule.mkdirSync(
        path.dirname(composePath),
        {
          recursive: true,
        }
      );

      fsModule.mkdirSync(
        resultsDir,
        {
          recursive: true,
        }
      );

      addRunLog(
        runId,
        "Converting topology JSON to docker-compose.yml"
      );

      const converterResult =
        await execFileFn(
          "go",
          ["run", ".", topologyPath],
          {
            cwd: converterDir,
          }
        );

      fsModule.writeFileSync(
        composePath,
        converterResult.stdout
      );

      addRunLog(
        runId,
        "docker-compose.yml created"
      );

      updateRun(runId, {
        step: "building",
      });

      addRunLog(
        runId,
        "Starting Docker environment"
      );

      const runnerCommand = path.join(
        runnerDir,
        "runner"
      );

      const runnerArgs = [
        "--compose",
        composePath,
        "--output",
        resultsDir,
      ];

      if (run.interactive) {
        runnerArgs.push("--interactive");
      } else {
        runnerArgs.push(
          "--duration",
          `${run.durationSeconds}s`
        );
      }

      await runSpawnedCommand({
        command: runnerCommand,
        args: runnerArgs,
        spawnFn,
        options: {
          cwd: runnerDir,
        },

        onProcess: (child) => {
          updateRun(runId, {
            process: child,
          });
        },

        onStdout: (line) => {
          handleRunnerOutput(
            runId,
            line
          );
        },

        onStderr: (line) => {
          addRunLog(
            runId,
            `[stderr] ${line}`
          );
        },

        onClose: () => {
          updateRun(runId, {
            process: null,
          });
        },
      });

      updateRun(runId, {
        status: "finished",
        step: "finished",
        finishedAt: Date.now(),
      });

      addRunLog(runId, "Finished");

    } catch (error) {
      updateRun(runId, {
        status: "failed",
        step: "failed",
        finishedAt: Date.now(),
        error:
          error.message ??
          String(error),
      });

      addRunLog(
        runId,
        `Failed: ${
          error.message ?? error
        }`
      );
    }
  }

  function stopEnvironmentJob(runId) {
    const run = getRun(runId);

    if (!run?.process) {
      return false;
    }

    addRunLog(
      runId,
      "Stopping interactive environment"
    );

    run.process.kill("SIGTERM");

    updateRun(runId, {
      step: "stopping",
    });

    return true;
  }

  return {
    runEnvironmentJob,
    stopEnvironmentJob,
  };
}

const jobs = createEnvironmentJobs();

export const runEnvironmentJob =
  jobs.runEnvironmentJob;

export const stopEnvironmentJob =
  jobs.stopEnvironmentJob;