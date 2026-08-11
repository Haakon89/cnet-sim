import "./interactive-page.css"
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InteractiveTerminal from "./InteractiveTerminal.jsx";
import { API_BASE } from "../../utils/constants";
import TopBar from "../layout/TopBar.jsx";
export default function InteractiveModePage() {
  const { runId } = useParams();

  const [run, setRun] = useState(null);
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [files, setFiles] = useState([]);
  const [stopRequested, setStopRequested] = useState(false);
  const nodeTypes = {
    pc: { label: "PC", icon: "💻" },
    webserver: { label: "Webserver", icon: "🌐" },
    router: { label: "Router", icon: "📡" },
    botnet: { label: "BotNet", icon: "👾" },
    bot: { label: "Bot", icon: "🤖" },
    botrouter: { label: "BotRouter", icon: "🦠" },
  };

  function getContainerType(container) {
    const text = `${container.name} ${container.service}`.toLowerCase();

    if (text.includes("webserver")) return "webserver";
    if (text.includes("botrouter")) return "botrouter";
    if (text.includes("botnet")) return "botnet";
    if (text.includes("router")) return "router";
    if (text.includes("bot")) return "bot";
    if (text.includes("pc")) return "pc";

    return "pc";
  }
  useEffect(() => {
    async function fetchStatus() {
      const response = await fetch(
        `${API_BASE}/api/environment/status/${runId}`
      );

      if (!response.ok) return;

      const data = await response.json();
      setRun(data);
    }

    fetchStatus();

    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [runId]);

  const runStep = run?.step;

  useEffect(() => {
    if (runStep !== "running") return;

    async function fetchContainers() {
      const response = await fetch(
        `${API_BASE}/api/interactive/${runId}/containers`
      );

      if (!response.ok) return;

      const data = await response.json();
      setContainers(data.containers ?? []);
    }

    fetchContainers();

    const interval = setInterval(fetchContainers, 1000);

    return () => clearInterval(interval);
  }, [runId, runStep]);

  const runStatus = run?.status;

  useEffect(() => {
    if (runStatus !== "finished") return;

    async function fetchFiles() {
      const response = await fetch(`${API_BASE}/api/results`);

      if (!response.ok) return;

      const data = await response.json();
      setFiles(data);
    }

    fetchFiles();
  }, [runStatus]);

  async function stopEnvironment() {
    setStopRequested(true);

    const response = await fetch(`${API_BASE}/api/environment/stop/${runId}`, {
      method: "POST",
    });

    if (!response.ok) {
      setStopRequested(false);
      alert("Failed to stop environment");
    }
  }

  if (!run) {
    return <div className="run-page">Loading interactive environment...</div>;
  }

  const environmentReady = run.step === "running";
  const environmentFinished = run.status === "finished";

  return (
    <>
      <TopBar />
      <div className="run-page">
        <section className="panel">
          <h1 className="panel-title">Interactive Environment</h1>

          <div className="info-row">
            <strong>Status</strong>
            <span>{run.status}</span>
          </div>

          <div className="info-row">
            <strong>Current step</strong>
            <span>{run.step}</span>
          </div>

          {!environmentReady && !environmentFinished && (
            <p className="hint">
              Environment is being prepared. Containers will appear when ready.
            </p>
          )}

          {environmentReady && !selectedContainer && (
            <p className="hint">
              Environment is ready. Select a container to open a terminal.
            </p>
          )}
        </section>

        {environmentReady && !selectedContainer && (
          <section className="panel">
            <h2 className="panel-subtitle">Available Containers</h2>

            {containers.length === 0 ? (
              <p>Waiting for containers...</p>
            ) : (
              <div className="container-grid">
                {containers.map((container) => {
                  const type = getContainerType(container);
                  const nodeType = nodeTypes[type];

                  return (
                    <button
                      className={`card container-card container-${type}`}
                      key={container.name}
                      onClick={() => setSelectedContainer(container.name)}
                    >
                      <div className="container-icon">{nodeType.icon}</div>

                      <div className="container-name">{container.name}</div>

                      <div className="container-meta">
                        {nodeType.label} · {container.state}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              className="btn btn-danger"
              onClick={stopEnvironment}
              disabled={stopRequested}
            >
              {stopRequested ? "Stopping environment..." : "Stop environment"}
            </button>
          </section>
        )}

        {environmentReady && selectedContainer && (
          <section className="panel">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedContainer(null)}
            >
              Back to containers
            </button>

            <h2 className="panel-subtitle">{selectedContainer}</h2>

            <div className="terminal-frame">
              <div className="terminal-header">
                <div className="terminal-title">{selectedContainer}</div>
              </div>

              <div className="terminal-body">
                <InteractiveTerminal
                  runId={runId}
                  containerName={selectedContainer}
                />
              </div>
            </div>
          </section>
        )}

        {run.step === "collecting" && (
          <section className="panel">
            <p className="hint">Collecting result files...</p>
          </section>
        )}

        {run.step === "shutting_down" && (
          <section className="panel">
            <p className="hint">Removing Docker environment...</p>
          </section>
        )}

        {environmentFinished && (
          <section className="panel">
            <h2 className="panel-subtitle">Generated Files</h2>

            {files.length === 0 ? (
              <p>No result files found.</p>
            ) : (
              <div className="file-list">
                {files.map((file) => (
                  <div className="card file-card" key={file.relativePath}>
                    <span>
                      {file.relativePath} ({file.size} bytes)
                    </span>

                    <a
                      href={`${API_BASE}/api/results/download?path=${encodeURIComponent(
                        file.relativePath
                      )}`}
                      download
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="panel">
          <h2 className="panel-subtitle">Logs</h2>
          <pre className="log-output">{run.logs.join("\n")}</pre>
        </section>

        {run.error && (
          <section className="panel">
            <h2 className="panel-subtitle">Error</h2>
            <pre className="log-output log-output-error">{run.error}</pre>
          </section>
        )}
      </div>
    </>
  );
}