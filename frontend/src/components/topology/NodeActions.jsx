//form for setting up traffic actions between nodes, can be added to through ROLE_ACTION_CONFIG in src/utils/constants.js
export default function NodeActionForm({
  config,
  trafficType,
  setTrafficType,
  sourceIp,
  setSourceIp,
  destinationIp,
  setDestinationIp,
  duration,
  setDuration,
  sourceIps,
  destinationOptions,
  onSubmit,
}) {
  return (
    <>
      <h3 className="panel-subtitle">{config.title}</h3>

        <div className="form-group">
          <label className="form-label">{config.typeLabel}</label>

          <select
            className="form-control"
            value={trafficType}
            onChange={(e) => setTrafficType(e.target.value)}
          >
            {config.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Source IP</label>

          <select
            className="form-control"
            value={sourceIp}
            onChange={(e) => {
              setSourceIp(e.target.value);
              setDestinationIp("");
            }}
          >
            <option value="">Choose source IP</option>
            {sourceIps.map(({ networkId, ip }) => (
              <option key={`${networkId}-${ip}`} value={ip}>
                {ip} ({networkId})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Destination IP</label>

          <select
            className="form-control"
            value={destinationIp}
            onChange={(e) => setDestinationIp(e.target.value)}
          >
            <option value="">Choose destination IP</option>
            {destinationOptions.map((option) => (
              <option
                key={`${option.nodeId}-${option.networkId}-${option.ip}`}
                value={option.ip}
              >
                {option.ip} - {option.nodeId} ({option.networkId})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Duration: {duration} seconds</label>

          <input
            className="range-control"
            type="range"
            min="0"
            max="120"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        <button className="btn btn-full btn-success" onClick={onSubmit}>
          {config.buttonText}
        </button>
    </>
  );
}