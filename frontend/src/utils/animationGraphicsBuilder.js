export function buildCanvasElements(animationJson) {
  const jsonNodes = animationJson.nodes ?? [];
  const jsonNetworks = animationJson.networks ?? [];

  const nodePositions = layoutNodesByNetwork(jsonNetworks);

  const nodes = jsonNodes.map((node) => {
    const role = guessNodeRole(node.id);

    return {
      id: node.id,
      type: "roleNode",
      position: nodePositions[node.id] ?? { x: 0, y: 0 },
      data: {
        label: node.id,
        role,
        interfaces: node.interfaces ?? [],
        networks: (node.interfaces ?? []).map((iface) => iface.network),
      },
    };
  });

  const edges = buildNetworkEdges(jsonNetworks);

  const rawPackets = animationJson.packets ?? [];
  const packets = normalizePackets(rawPackets);
  const maxTime = getMaxPacketTime(rawPackets);

  return { nodes, edges, networks: jsonNetworks, packets, maxTime };
}

function layoutNodesByNetwork(networks) {
  const positions = {};
  const networkPositions = {};

  const networkSpacingX = 860;
  const networkSpacingY = 620;
  const nodeSpacingX = 220;
  const nodeSpacingY = 210;

  networks.forEach((network, networkIndex) => {
    const baseX = 120 + (networkIndex % 3) * networkSpacingX;
    const baseY = 120 + Math.floor(networkIndex / 3) * networkSpacingY;

    networkPositions[network.id] = { x: baseX, y: baseY };

    const alreadyPlaced = network.nodes.filter((nodeId) => positions[nodeId]);
    const unplaced = network.nodes.filter((nodeId) => !positions[nodeId]);

    let anchor;

    if (alreadyPlaced.length > 0) {
      anchor = positions[alreadyPlaced[0]];
    } else {
      anchor = { x: baseX, y: baseY };
    }

    unplaced.forEach((nodeId, index) => {
      positions[nodeId] = {
        x: anchor.x + (index + 1) * nodeSpacingX,
        y: anchor.y + (index % 2) * nodeSpacingY,
      };
    });
  });

  return positions;
}

function buildNetworkEdges(networks) {
  const edges = [];

  for (const network of networks) {
    const networkNodes = network.nodes ?? [];

    for (let i = 0; i < networkNodes.length; i++) {
      for (let j = i + 1; j < networkNodes.length; j++) {
        edges.push({
          id: `${network.id}-${networkNodes[i]}-${networkNodes[j]}`,
          source: networkNodes[i],
          target: networkNodes[j],
          label: network.id,
          animated: false,
          data: {
            networkId: network.id,
          },
        });
      }
    }
  }

  return edges;
}

export function normalizePackets(packets) {
  return packets.map((packet) => {
    const path = packet.path ?? [];
    const first = path[0];
    const last = path[path.length - 1];

    return {
      id: packet.id,
      protocol: packet.protocol ?? "unknown",
      srcIp: packet.sourceIp,
      dstIp: packet.destinationIp,
      length: packet.sizeBytes,
      ttl: first?.ttl,
      startTime: (first?.timeMs ?? packet.startTimeMs ?? 0),
      duration: ((last?.timeMs ?? 1) - (first?.timeMs ?? 0)),
      path: path.map((hop) => hop.node),
      rawPath: path,
    };
  });
}

function getMaxPacketTime(packets) {
  let max = 0;

  for (const packet of packets) {
    for (const hop of packet.path ?? []) {
      max = Math.max(max, (hop.timeMs ?? 0));
    }
  }

  return max > 0 ? max : 300;
}

function guessNodeRole(id) {
  if (id.startsWith("router")) return "router";
  if (id.startsWith("webserver")) return "webserver";
  if (id.startsWith("botnet")) return "botnet";
  if (id.startsWith("botrouter")) return "botrouter";
  if (id.startsWith("bot")) return "bot";
  return "pc";
}