import express from "express";
import crypto from "crypto";

import { runs } from "../state/runs.js";
import { runEnvironmentJob, stopEnvironmentJob } from "../jobs/runEnvironmentJob.js";

const router = express.Router();

router.post("/run", (req, res) => {
  const runId = crypto.randomUUID();

  const interactive = req.body.interactive === true;

  const durationSeconds = Math.min(
    120,
    Math.max(1, Number.parseInt(req.body.durationSeconds, 10) || 60)
  );

  runs.set(runId, {
    status: "active",
    step: "queued",
    logs: [],
    startedAt: Date.now(),
    runningStartedAt: null,
    durationSeconds,
    interactive,
    process: null,
    composePath: null,
    finishedAt: null,
    error: null,
  });

  res.json({ runId });

  runEnvironmentJob(runId);
});

router.get("/status/:runId", (req, res) => {
  const run = runs.get(req.params.runId);

  if (!run) {
    return res.status(404).json({ error: "Run not found" });
  }

  res.json(run);
});

router.post("/stop/:runId", (req, res) => {
  const stopped = stopEnvironmentJob(req.params.runId);

  if (!stopped) {
    return res.status(404).json({ error: "No running environment found" });
  }

  res.json({ ok: true });
});

export default router;