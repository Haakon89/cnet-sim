//generates new id for a newly made node
export function getNextNodeId(nodesList) {
  let maxId = 0;

  for (const node of nodesList) {
    const match = node.id?.match(/-(\d+)$/);
    if (!match) continue;

    maxId = Math.max(maxId, Number(match[1]));
  }

  return maxId + 1;
}

//generates an id for a newly made network
export function getNextNetworkId(networksList) {
  let maxId = 0;

  for (const network of networksList) {
    const match = network.id?.match(/^net(\d+)$/);
    if (!match) continue;

    maxId = Math.max(maxId, Number(match[1]));
  }

  return maxId + 1;
}