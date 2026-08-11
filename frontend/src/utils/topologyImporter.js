//takes in a json and rebuilds the topologys node structure from that file
export function buildImportedNodes(templateJSON) {
  return [
    ...(templateJSON.nodes ?? []).map((node) => ({
      id: node.id,
      type: "roleNode",
      position: node.position,
      data: {
        label: node.id,
        role: node.role,
        networks: node.networks ?? [],
        ipAddresses: node.ipAddresses ?? {},
      },
    })),

    ...(templateJSON.botNets ?? []).map((botNet) => ({
      id: botNet.id,
      type: "roleNode",
      position: botNet.position,
      data: {
        label: botNet.id,
        role: "botnet",
        size: botNet.size,
        networks: botNet.networks ?? [],
        ipAddresses: botNet.ipAddresses ?? {},
      },
    })),
  ];
}

//takes in a json and rebuilds the topologys edge structure from that file
export function buildImportedEdges(templateJSON) {
  return (templateJSON.links ?? []).map((link, index) => {
    const network = templateJSON.networks?.find(
      (network) => network.id === link.networkId
    );

    const distance = link.distance ?? 10;

    return {
      id: `${link.networkId ?? "edge"}-${link.source}-${link.target}-${index}`,
      source: link.source,
      target: link.target,
      label: `${distance}m`,
      type: "straight",
      data: {
        networkId: link.networkId,
        distance,
      },
      style: {
        stroke: network?.color ?? "#94a3b8",
        strokeWidth: 4,
      },
      animated: false,
    };
  });
}