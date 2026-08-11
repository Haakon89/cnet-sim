//converts an ip address to an integer
export function ipToInt(ip) {
  return ip
    .split(".")
    .map(Number)
    .reduce((acc, octet) => (acc << 8) + octet, 0) >>> 0;
}

//converts an integer to an ip address
export function intToIp(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join(".");
}

//gets a list of IP addresses from nodes connected to a given network
export function getIpAddressesInNetwork(networkId, nodesList) {
  return nodesList
    .map((node) => node.data.ipAddresses?.[networkId])
    .filter(Boolean);
}

//generates an unused IP address if one is available
export function generateUnusedIp(nodeRole, subnet, usedIps = []) {
  const [baseIp, prefixStr] = subnet.split("/");
  const prefix = Number(prefixStr);

  const base = ipToInt(baseIp);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;

  const network = base & mask;
  const broadcast = network | (~mask >>> 0);

  const start = nodeRole === "router" || nodeRole === "botrouter" ? network + 2 : network + 10;
  const used = new Set(usedIps);

  for (let ip = start; ip < broadcast; ip++) {
    const candidate = intToIp(ip);

    if (!used.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No available IPs in subnet ${subnet}`);
}