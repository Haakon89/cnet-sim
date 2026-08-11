import "./animation-page.css";
import { useMemo } from "react";
import { ViewportPortal } from "@xyflow/react";

export default function PacketLayer({
  packets = [],
  nodes = [],
  currentTime = 0,
  onPacketClick = () => {},
}) {
  const nodeCenters = useMemo(() => {
    const centers = {};

    for (const node of nodes) {
      centers[node.id] = getNodeCenter(node);
    }

    return centers;
  }, [nodes]);

  return (
    <ViewportPortal>
      <div className="packet-layer">
        <svg className="packet-svg">
          {packets.map((packet) => {
            const segment = getPacketSegment(
              packet,
              nodeCenters,
              currentTime
            );

            if (!segment) return null;

            return (
              <PacketOnPath
                key={packet.id}
                packet={packet}
                from={segment.from}
                to={segment.to}
                progress={segment.localProgress}
                onPacketClick={onPacketClick}
              />
            );
          })}
        </svg>
      </div>
    </ViewportPortal>
  );
}

function PacketOnPath({
  packet,
  from,
  to,
  progress,
  onPacketClick,
}) {
  const x = from.x + (to.x - from.x) * progress;
  const y = from.y + (to.y - from.y) * progress;

  const protocol = packet.protocol ?? "unknown";

  return (
    <circle
      cx={x}
      cy={y}
      r="8"
      className={`packet-dot packet-${protocol.toLowerCase()}`}
      onClick={(event) => {
        event.stopPropagation();
        onPacketClick(packet);
      }}
    >
      <title>
        {protocol}: {packet.srcIp} → {packet.dstIp}
      </title>
    </circle>
  );
}

function getPacketSegment(packet, nodeCenters, currentTime) {
  const { path, startTime, duration } = packet;

  if (!path || path.length < 2) return null;
  if (!Number.isFinite(startTime)) return null;
  if (!Number.isFinite(duration) || duration <= 0) return null;
  if (currentTime < startTime) return null;
  if (currentTime > startTime + duration) return null;

  const progress = Math.min(
    Math.max((currentTime - startTime) / duration, 0),
    1
  );

  const segmentCount = path.length - 1;
  const segmentProgress = progress * segmentCount;

  const segmentIndex = Math.min(
    Math.floor(segmentProgress),
    segmentCount - 1
  );

  const localProgress =
    progress >= 1
      ? 1
      : segmentProgress - segmentIndex;

  const from = nodeCenters[path[segmentIndex]];
  const to = nodeCenters[path[segmentIndex + 1]];

  if (!from || !to) return null;

  return {
    from,
    to,
    localProgress,
  };
}

function getNodeCenter(node) {
  return {
    x: node.position.x + 60,
    y: node.position.y + 54,
  };
}