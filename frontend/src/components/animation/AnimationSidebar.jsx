import "./animation-page.css";

export default function AnimationSidebar({
  animations = [],
  selectedAnimation,
  setSelectedAnimation,
  loadSelectedAnimation,

  currentTime,
  setCurrentTime,
  isPlaying,
  togglePlayback,
  maxTime,

  playbackDuration,
  setPlaybackDuration,

  selectedNode,
  packets = [],
  selectedPacket,
}) {
  const nodeActivity = selectedNode
  ? getNodePacketActivity({
      nodeId: selectedNode.id,
      packets,
      currentTime,
    })
  : null;
  function handleTimelineChange(event) {
    const value = Number(event.target.value);

    if (Number.isFinite(value)) {
      setCurrentTime(value);
    }
  }

  function getNodePacketActivity({
    nodeId,
    packets,
    currentTime,
  }) {
    const activity = {
      incoming: [],
      outgoing: [],
      queued: [],
      processing: [],
    };

    if (!nodeId) {
      return activity;
    }

    for (const packet of packets) {
      const state = getPacketNodeState(packet, nodeId, currentTime);

      if (!state) continue;

      activity[state.type].push({
        packet,
        ...state,
      });
    }

    return activity;
  }

  function getPacketNodeState(packet, nodeId, currentTime) {
    const { path, startTime, duration } = packet;

    if (!Array.isArray(path) || path.length < 2) return null;
    if (!Number.isFinite(startTime)) return null;
    if (!Number.isFinite(duration) || duration <= 0) return null;

    const packetEndTime = startTime + duration;

    if (currentTime < startTime || currentTime > packetEndTime) {
      return null;
    }

    const totalProgress = Math.min(
      Math.max((currentTime - startTime) / duration, 0),
      1
    );

    const segmentCount = path.length - 1;
    const segmentProgress = totalProgress * segmentCount;

    const segmentIndex = Math.min(
      Math.floor(segmentProgress),
      segmentCount - 1
    );

    const localProgress =
      totalProgress >= 1
        ? 1
        : segmentProgress - segmentIndex;

    const fromNodeId = path[segmentIndex];
    const toNodeId = path[segmentIndex + 1];

    if (toNodeId === nodeId && localProgress >= 0.75) {
      return {
        type: "incoming",
        progress: localProgress,
        fromNodeId,
        toNodeId,
      };
    }

    if (fromNodeId === nodeId && localProgress <= 0.25) {
      return {
        type: "outgoing",
        progress: localProgress,
        fromNodeId,
        toNodeId,
      };
    }

    return null;
  }
  return (
    <aside className="animation-sidebar">
      <section className="panel">
        <h2 className="panel-title">Traffic Animation</h2>

        <div className="form-group">
          <label
            className="form-label"
            htmlFor="animation-select"
          >
            Available animations
          </label>

          <select
            className="form-control"
            id="animation-select"
            value={selectedAnimation}
            onChange={(event) =>
              setSelectedAnimation(event.target.value)
            }
          >
            {animations.map((animation) => (
              <option key={animation} value={animation}>
                {animation}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-full btn-primary"
          onClick={loadSelectedAnimation}
          disabled={!selectedAnimation}
        >
          Load animation
        </button>

        <button
          className={`btn btn-full ${
            isPlaying ? "btn-warning" : "btn-success"
          }`}
          onClick={togglePlayback}
          disabled={maxTime <= 0}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </section>

      <section className="panel">
        <h3 className="panel-subtitle">Timeline</h3>

        <div className="form-group">
          <label
            className="form-label"
            htmlFor="animation-timeline"
          >
            Current time
          </label>

          <input
            className="range-control"
            id="animation-timeline"
            type="range"
            min="0"
            max={maxTime}
            step="any"
            value={Math.min(currentTime, maxTime)}
            onChange={handleTimelineChange}
          />

          <p className="text-muted">
            {currentTime.toFixed(3)} ms / {maxTime.toFixed(3)} ms
          </p>
        </div>

        <div className="form-group">
          <label
            className="form-label"
            htmlFor="playback-duration"
          >
            Animation playback time
          </label>

          <select
            className="form-control"
            id="playback-duration"
            value={playbackDuration}
            onChange={(event) => {
              setPlaybackDuration(Number(event.target.value));
            }}
          >
            <option value={1000}>1 second</option>
            <option value={2000}>2 seconds</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
          </select>

          <p className="text-muted">
            {maxTime.toFixed(3)} ms of network traffic shown over{" "}
            {(playbackDuration / 1000).toFixed(1)} seconds
          </p>
        </div>
      </section>
      {selectedNode && nodeActivity && (
        <section className="panel node-details">
          <h3 className="panel-subtitle">Node Details</h3>

          <div className="info-row">
            <strong>Name</strong>
            <span>{selectedNode.id}</span>
          </div>

          <div className="info-row">
            <strong>Role</strong>
            <span>{selectedNode.data?.role ?? "Unknown"}</span>
          </div>

          <div className="info-row">
            <strong>Incoming</strong>
            <span>{nodeActivity.incoming.length}</span>
          </div>

          <div className="info-row">
            <strong>Outgoing</strong>
            <span>{nodeActivity.outgoing.length}</span>
          </div>

          <div className="info-row">
            <strong>Queued</strong>
            <span>{nodeActivity.queued.length}</span>
          </div>

          <NodePacketSection
            title="Incoming packets"
            entries={nodeActivity.incoming}
          />

          <NodePacketSection
            title="Outgoing packets"
            entries={nodeActivity.outgoing}
          />

          <NodePacketSection
            title="Queued packets"
            entries={nodeActivity.queued}
          />
        </section>
      )}  
      {selectedPacket && (
        <section className="panel packet-details">
          <h3 className="panel-subtitle">Packet Details</h3>

          <div className="info-row">
            <strong>Protocol</strong>
            <span>{selectedPacket.protocol ?? "Unknown"}</span>
          </div>

          <div className="info-row">
            <strong>Source</strong>
            <span>{selectedPacket.srcIp ?? "Unknown"}</span>
          </div>

          <div className="info-row">
            <strong>Destination</strong>
            <span>{selectedPacket.dstIp ?? "Unknown"}</span>
          </div>

          <div className="info-row">
            <strong>Length</strong>
            <span>
              {selectedPacket.length !== undefined
                ? `${selectedPacket.length} bytes`
                : "Unknown"}
            </span>
          </div>

          <div className="info-row">
            <strong>TTL</strong>
            <span>{selectedPacket.ttl ?? "Unknown"}</span>
          </div>
        </section>
      )}
    </aside>
  );
}

function NodePacketSection({ title, entries }) {
  return (
    <div className="node-packet-section">
      <h4>{title}</h4>

      {entries.length === 0 ? (
        <p className="text-muted">No packets</p>
      ) : (
        <div className="node-packet-list">
          {entries.map(({ packet, fromNodeId, toNodeId }) => (
            <div
              className="node-packet-item"
              key={`${title}-${packet.id}`}
            >
              <div>
                <strong>{packet.protocol ?? "Unknown"}</strong>
              </div>

              <div className="text-muted">
                {fromNodeId} → {toNodeId}
              </div>

              <div className="text-muted">
                {packet.srcIp} → {packet.dstIp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}