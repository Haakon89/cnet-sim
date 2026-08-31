import express from "express";
import { execFile } from "child_process";
import { runs } from "../state/runs.js";

export function createInteractiveRouter(execFileFn = execFile) {
  const router = express.Router();

  router.get("/:runId/containers", async (req, res) => {
    const run = runs.get(req.params.runId);

    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    if (!run.composePath) {
      return res.status(400).json({
        error: "Compose file not ready yet",
      });
    }

    execFileFn(
      "docker",
      [
        "compose",
        "-p",
        "netsim_test",
        "-f",
        run.composePath,
        "ps",
        "--format",
        "json",
      ],
      (err, stdout) => {
        if (err) {
          return res.status(500).json({
            error: err.message,
          });
        }

        const containers = stdout
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const item = JSON.parse(line);

            return {
              name: item.Name,
              service: item.Service,
              state: item.State,
            };
          });

        res.json({ containers });
      }
    );
  });

  return router;
}

export default createInteractiveRouter();