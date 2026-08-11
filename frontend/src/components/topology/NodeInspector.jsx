import "./topology.css"
import { useState } from "react";
import { nodeTypes, ROLE_ACTION_CONFIG, ALLOWED_DESTINATION_ROLES } from "../../utils/constants"
import NodeActionForm from "./NodeActions"

function getDefaultTrafficType(node) {
  const traffic = nodeTypes[node?.data?.role]?.traffic;

  if (traffic === "attack") {
    return "ddos";
  }

  if (traffic === "standard") {
    return "icmp";
  }

  return "";
}
//interface for anything that has to do with a selected node. 
// Displays information and can be used to build interctive menues that changes aspects of the node
export default function NodeInspector({
  node,
  nodes,
  trafficFlows,
  onAddTraffic,
}) {
  const [trafficType, setTrafficType] = useState(
    () => getDefaultTrafficType(node)
  );
  const [sourceIp, setSourceIp] = useState("");
  const [destinationIp, setDestinationIp] = useState("");
  const [duration, setDuration] = useState(60);

  const role = node?.data?.role;
  const trafficGroup = nodeTypes[role]?.traffic;
  const config = ROLE_ACTION_CONFIG[trafficGroup];
  const allowedRoles =
    ALLOWED_DESTINATION_ROLES[trafficType] ?? ["all"];

  const roleAllowed = (role) =>
    allowedRoles.includes("all") || allowedRoles.includes(role);

  const sourceIps = Object.entries(
    node.data.ipAddresses ?? {}
  ).map(([networkId, ip]) => ({
    networkId,
    ip,
  }));

  const destinationOptions = nodes
  .filter((n) => n.id !== node.id)
  .filter((n) => roleAllowed(n.data.role))
  .flatMap((other) =>
    Object.entries(other.data.ipAddresses ?? {}).map(([networkId, ip]) => ({
      nodeId: other.id,
      role: other.data.role,
      networkId,
      ip,
    }))
  );

  const nodeTraffic = trafficFlows.filter(
    (flow) => flow.source === node.id
  );
  
  function handleAddTraffic() {
    if (!sourceIp || !destinationIp) return;

    const destination = destinationOptions.find(
      (option) => option.ip === destinationIp
    );

    if (!destination) return;

    onAddTraffic({
      source: node.id,
      sourceIp,
      destination: destination.nodeId,
      destinationIp,
      type: trafficType,
      duration,
    });

    setSourceIp("");
    setDestinationIp("");
    setDuration(60);
  }
  

  return (
    <div
      className="inspector"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <h3>Selected node</h3>

      <div className="info-row">
        <strong>ID:</strong>
        <span>{node.id}</span>
      </div>

      <div className="info-row">
        <strong>Role:</strong>
        <span>{node.data.role}</span>
      </div>

      <div className="info-row">
        <strong>Networks:</strong>
        <span>
          {node.data.networks?.length > 0
            ? node.data.networks.join(", ")
            : "None"}
        </span>
      </div>

      <div className="info-row">
        <strong>IP addresses:</strong>
        <span>
          {sourceIps.length > 0
            ? sourceIps.map(({ networkId, ip }) => `${networkId}: ${ip}`).join(", ")
            : "None"}
        </span>
      </div>
      {node.data.role === "botnet" && (
        <div className="info-row">
          <strong>Botnet size:</strong>
          <span>{node.data.size}</span>
        </div>
      )}
      {config && (
        <>
          <NodeActionForm
            config={config}
            trafficType={trafficType}
            setTrafficType={setTrafficType}
            sourceIp={sourceIp}
            setSourceIp={setSourceIp}
            destinationIp={destinationIp}
            setDestinationIp={setDestinationIp}
            duration={duration}
            setDuration={setDuration}
            sourceIps={sourceIps}
            destinationOptions={destinationOptions}
            onSubmit={handleAddTraffic}
          />

          {nodeTraffic.length > 0 && (
            <>
              <h3>Traffic from this node</h3>

              {nodeTraffic.map((flow) => (
                <div className="traffic-card" key={flow.id}>
                  <strong>{flow.type}</strong>
                  <span>
                    {flow.sourceIp ?? flow.source} →{" "}
                    {flow.destinationIp ?? flow.destination} ({flow.duration}s)
                  </span>
                </div>
              ))}
            </>
          )}
        </>
      )} 
    </div>
  );
}