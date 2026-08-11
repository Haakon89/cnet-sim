import { Handle, Position } from "@xyflow/react";
import { nodeTypes } from "../../utils/constants";

//sets up the graphical look of the nodes for the GUI
export default function NodeGraphic({ data }) {
  const role = nodeTypes[data.role];

  return (
    <div className={`role-node role-${data.role}`}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0,
        }}
      />

      <div className="node-icon">{role?.icon ?? "⚙️"}</div>
      <div className="node-label">{data.label}</div>
      <div className="node-role">{role?.label ?? data.role}</div>

      {data.networks?.length > 0 && (
        <div className="node-network">{data.networks.join(", ")}</div>
      )}

      <Handle
        type="source"
        position={Position.Top}
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0,
        }}
      />
    </div>
  );
}