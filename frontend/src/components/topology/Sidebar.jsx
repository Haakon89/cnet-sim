import "./topology.css";
import NodeInspector from "./NodeInspector";
import EdgeInspector from "./EdgeInspector";
import { nodeTypes } from "../../utils/constants";

//graphical display on the left side of the screen used to store user actions and information about the selected elements.
export default function Sidebar({
  interactiveMode,
  setInteractiveMode,
  durationSeconds,
  setDurationSeconds,
  selectedTemplate,
  setSelectedTemplate,
  importTopology,
  selectedRole,
  setSelectedRole,
  selectedEdge,
  updateEdgeDistance,
  addNode,
  createNetworkFromSelection,
  exportTemplate,
  runEnvironment,
  selectedNode,
  templates,
  nodes,
  trafficFlows,
  addTrafficFlow,
  networks,
  addSelectionToNetwork,
  removeSelectionFromNetwork,
  removeNetwork,
}) {
  return (
    <aside className="sidebar">
      <section className="panel">
        <h2 className="panel-title">Network Builder</h2>

        <div className="form-group">
          <label className="form-label">Interactive mode</label>

          <div className="segmented-control">
            <button
              type="button"
              className={`btn segment ${interactiveMode ? "is-active" : ""}`}
              onClick={() => setInteractiveMode(true)}
            >
              ON
            </button>

            <button
              type="button"
              className={`btn segment ${!interactiveMode ? "is-active" : ""}`}
              onClick={() => setInteractiveMode(false)}
            >
              OFF
            </button>
          </div>
        </div>

        {!interactiveMode && (
          <div className="form-group">
            <label className="form-label">
              Run time: {durationSeconds} seconds
            </label>

            <input
              className="range-control"
              type="range"
              min="10"
              max="120"
              step="5"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
            />
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-subtitle">Templates</h3>

        <div className="form-group">
          <label className="form-label">Available templates</label>

          <select
            className="form-control"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {templates.map((template) => (
              <option key={template} value={template}>
                {template}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-full btn-primary"
          onClick={() => importTopology(selectedTemplate)}
        >
          Load template
        </button>
      </section>

      <section className="panel">
        <h3 className="panel-subtitle">Nodes</h3>

        <div className="form-group">
          <label className="form-label">Node role</label>

          <select
            className="form-control"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {Object.entries(nodeTypes).map(([roleId, role]) => (
              <option key={roleId} value={roleId}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-full btn-success" onClick={() => addNode()}>
          Add node
        </button>

        <button
          className="btn btn-full btn-primary"
          onClick={createNetworkFromSelection}
        >
          Create network from selection
        </button>
      </section>

      <section className="panel">
        <h3 className="panel-subtitle">Environment</h3>

        <button className="btn btn-full btn-primary" onClick={exportTemplate}>
          Save as template
        </button>

        <button className="btn btn-full btn-primary" onClick={runEnvironment}>
          Run Network Environment
        </button>
      </section>

      <section className="panel">
        <h3 className="panel-subtitle">Help</h3>

        <div className="hint">
          <p>
            Select multiple nodes with Shift+drag mouse or Ctrl/Meta + click mouse.
          </p>

          <strong>Shortcuts:</strong>

          <ul>
            <li>N = create new node</li>
            <li>P = create PC node</li>
            <li>R = create router node</li>
            <li>Del or Backspace = delete selected nodes</li>
          </ul>
        </div>
      </section>

      {selectedNode && (
        <section className="panel">
          <NodeInspector
            node={selectedNode}
            nodes={nodes}
            trafficFlows={trafficFlows}
            onAddTraffic={addTrafficFlow}
          />
        </section>
      )}

      {selectedEdge && (
        <section className="panel">
          <EdgeInspector
            edge={selectedEdge}
            nodes={nodes}
            onUpdateDistance={updateEdgeDistance}
          />
        </section>
      )}

      <section className="panel">
        <h3 className="panel-subtitle">Networks</h3>

        <div className="network-list">
          {networks.map((net) => (
            <div className="network-card" key={net.id}>
              <strong>{net.id}</strong>
              <span>{net.subnet}</span>
              <small>{net.nodes.length} nodes</small>

              <button
                className="btn btn-full btn-success"
                onClick={() => addSelectionToNetwork(net.id)}
              >
                Add to network
              </button>

              <button
                className="btn btn-full btn-warning"
                onClick={() => removeSelectionFromNetwork(net.id)}
              >
                Remove from network
              </button>

              <button
                className="btn btn-full btn-danger"
                onClick={() => removeNetwork(net.id)}
              >
                Remove network
              </button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}