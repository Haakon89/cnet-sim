//extracts all the information needed to build the json file for either save topology or save template
export function serializeTopology({ nodes, edges, networks, trafficFlows, nodeId, networkId }) {
  const normalNodes = nodes.filter((node) => node.data.role !== "botnet");
  const botNets = nodes.filter((node) => node.data.role === "botnet");

  return {
    nextIds: {
      nodeId,
      networkId,
    },

    nodes: normalNodes.map((node) => ({
      id: node.id,
      role: node.data.role,
      networks: node.data.networks,
      ipAddresses: node.data.ipAddresses ?? {},
      position: node.position,
    })),

    botNets: botNets.map((botNet) => ({
      id: botNet.id,
      role: botNet.data.role,
      size: botNet.data.size,
      networks: botNet.data.networks,
      ipAddresses: botNet.data.ipAddresses ?? {},
      position: botNet.position,
    })),

    networks,

    links: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      networkId: edge.data?.networkId,
      distance: edge.data?.distance ?? 10,
    })),

    trafficFlows,
  };
}