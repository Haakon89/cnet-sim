import "./interactive-page.css"
import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { API_BASE } from "../../utils/constants";

export default function InteractiveTerminal({ runId, containerName }) {
  const terminalRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    const WS_BASE = API_BASE.replace(/^http/, "ws");

    const socket = new WebSocket(
      `${WS_BASE}/api/interactive?runId=${encodeURIComponent(runId)}&container=${encodeURIComponent(containerName)}`
    );

    socket.onmessage = (event) => {
      term.write(event.data);
    };

    term.onData((data) => {
      socket.send(data);
    });

    return () => {
      socket.close();
      term.dispose();
    };
  }, [runId, containerName]);

  return (
    <div
      ref={terminalRef}
      style={{
        height: "500px",
        width: "100%",
        background: "black",
      }}
    />
  );
}