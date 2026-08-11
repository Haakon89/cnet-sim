import "./run-page.css"
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../../utils/constants";
import TopBar from "../layout/TopBar";

//This page presents how the docker environment is being run and updates the logs as the process is running and once it is finished it should display downloadable files
export default function RunEnvironmentPage() {
  const { runId } = useParams();
  const [run, setRun] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

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
  const runStatus = run?.status;

  useEffect(() => {
    if (runStep !== "running") {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [runStep]);

  useEffect(() => {
    if (runStatus !== "finished") {
      return;
    }

    async function fetchFiles() {
      const response = await fetch(`${API_BASE}/api/results`);

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setFiles(data);
    }

    fetchFiles();
  }, [runStatus]);

  if (!run) {
    return <div className="run-page">Loading run...</div>;
  }

  let remainingSeconds = run.durationSeconds;

  if (run.step === "running" && run.runningStartedAt) {
    const elapsedSeconds = Math.floor(
      (currentTime - run.runningStartedAt) / 1000
    );

    remainingSeconds = Math.max(
      run.durationSeconds - elapsedSeconds,
      0
    );
  }

  

  return (
    <>
    <TopBar />
    <div className="run-page">
      <section className="panel">
        <h1 className="panel-title">Running Environment</h1>

        <div className="info-row">
          <strong>Status</strong>
          <span>{run.status}</span>
        </div>

        <div className="info-row">
          <strong>Current step</strong>
          <span>{run.step}</span>
        </div>

        <div className="info-row">
          <strong>Approximate time remaining</strong>
          <span>
            {run.step === "running" && remainingSeconds !== null
              ? `${remainingSeconds}s`
              : run.status === "finished"
              ? "Done"
              : "Not started yet"}
          </span>
        </div>
      </section>

      {run.status === "finished" && (
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

        <pre className="log-output">
          {run.logs.join("\n")}
        </pre>
      </section>

      {run.error && (
        <section className="panel">
          <h2 className="panel-subtitle">Error</h2>

          <pre className="log-output log-output-error">
            {run.error}
          </pre>
        </section>
      )}
    </div>
    </>
  );
}