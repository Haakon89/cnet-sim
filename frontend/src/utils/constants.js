// src/utils/constants.js
export const initialNodes = [];
export const initialEdges = [];

export const networkColors = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#a855f7",
  "#eab308",
  "#14b8a6",
  "#ef4444",
];

export const API_BASE = "http://localhost:3000";

export const nodeTypes = {
  pc: {
    label: "PC",
    icon: "💻",
    traffic: "standard",
  },
  webserver: {
    label: "Webserver",
    icon: "🌐",
    traffic: ""
  },
  router: {
    label: "Router",
    icon: "📡",
    traffic: ""
  },
  fileserver: {
    label: "File Server",
    icon: "🗃️",
    traffic: ""
  },
  botnet: {
    label: "BotNet",
    icon: "👾",
    traffic: "attack"
  },
  bot: {
    label: "Bot",
    icon: "🤖",
    traffic: "attack"
  },
  botrouter: {
    label: "BotRouter",
    icon: "🦠",
    traffic: ""
  }
};

export const ROLE_ACTION_CONFIG = {
  standard: {
    title: "Add traffic",
    typeLabel: "Traffic type",
    buttonText: "Add traffic",
    defaultType: "icmp",
    options: [
      { value: "icmp", label: "ICMP ping" },
      { value: "tcp", label: "TCP connection" },
      { value: "udp", label: "UDP traffic" },
      { value: "http", label: "HTTP request" },
      { value: "iperf3", label: "iperf3 bandwidth test" },
      { value: "upload", label: "file upload" },
      { value: "download", label: "file download" }
    ],
  },

  attack: {
    title: "Add attack",
    typeLabel: "Attack type",
    buttonText: "Add attack",
    defaultType: "ddos",
    options: [
      { value: "ddos", label: "DDOS" },
    ],
  },
};

export const ALLOWED_DESTINATION_ROLES = {
  icmp: ["all"],
  tcp: ["all"],
  udp: ["all"],
  http: ["webserver"],
  iperf3: ["all"],
  upload: ["fileserver"],
  download: ["fileserver"],
  ddos: ["webserver", "fileserver"],
};