export default function EdgeInspector({ edge, nodes, onUpdateDistance }) {
  if (!edge) return null;

  const distance = edge.data?.distance ?? 10;

  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);

  return (
    <div
      className="inspector"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <h3>Selected edge</h3>

      <div className="info-row">
        <strong>ID:</strong>
        <span>{edge.id}</span>
      </div>

      <div className="info-row">
        <strong>Network:</strong>
        <span>{edge.data?.networkId ?? "Unknown"}</span>
      </div>

      <div className="info-row">
        <strong>Source:</strong>
        <span>{sourceNode?.data?.label ?? edge.source}</span>
      </div>

      <div className="info-row">
        <strong>Target:</strong>
        <span>{targetNode?.data?.label ?? edge.target}</span>
      </div>

      <div className="form-group">
        <label className="form-label">
          Distance {distance} m
        </label>

        <input
          className="range-control"
          type="range"
          min="0"
          max="100000"
          step="100"
          value={distance}
          onChange={(event) => {
            onUpdateDistance(
              edge.id,
              Number(event.target.value)
            );
          }}
        />
      </div>
    </div>
  );
}