import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import pty from "node-pty";

import topologyRoutes from "./routes/topologyRoutes.js";
import interactiveRoutes from "./routes/interactiveRoutes.js";
import environmentRoutes from "./routes/environmentRoutes.js";
import resultsRoutes from "./routes/resultsRoutes.js";
import templatesRoutes from "./routes/templatesRoutes.js";
import animationRoutes from "./routes/animationRoutes.js";
import { runs } from "./state/runs.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/topology", topologyRoutes);
app.use("/api/interactive", interactiveRoutes);
app.use("/api/environment", environmentRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/animation", animationRoutes);

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({
  server,
  path: "/api/interactive",
});

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  const runId = url.searchParams.get("runId");
  const container = url.searchParams.get("container");

  const run = runs.get(runId);

  if (!run || !container) {
    ws.close();
    return;
  }

  const shell = pty.spawn("docker", ["exec", "-it", container, "sh"], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
  });

  shell.onData((data) => ws.send(data));

  ws.on("message", (message) => {
    shell.write(message.toString());
  });

  ws.on("close", () => {
    shell.kill();
  });
});