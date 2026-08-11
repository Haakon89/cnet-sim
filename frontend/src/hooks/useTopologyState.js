// src/hooks/useTopologyState.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { useNavigate } from "react-router-dom";

import NodeGraphic from "../components/topology/NodeGraphic";
import { initialNodes, initialEdges, networkColors } from "../utils/constants";

import { loadTemplates, loadTemplate, saveTemplate, saveTopology } from "../api/templateApi";
import { startEnvironment } from "../api/runnerApi";

import {
  generateUnusedIp,
  getIpAddressesInNetwork,
} from "../utils/ipUtils";

import {
  getNextNodeId,
  getNextNetworkId,
} from "../utils/idUtils";

import { serializeTopology } from "../utils/topologySerializer";
import {
  buildImportedNodes,
  buildImportedEdges,
} from "../utils/topologyImporter";

import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

let nodeId = 1;
let networkId = 1;

//function running the frontend and handeling any calls to the backend
export function useTopologyState() {
  const nodeTypes = useMemo(() => ({ roleNode: NodeGraphic }), []);
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [networks, setNetworks] = useState([]);
  const [trafficFlows, setTrafficFlows] = useState([]);

  const [selectedRole, setSelectedRole] = useState("pc");
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [inspectedNodeId, setInspectedNodeId] = useState(null);

  const selectedNode =
    nodes.find((node) => node.id === inspectedNodeId) ?? null;

    useKeyboardShortcuts({
    deleteSelectedNode, 
    addNode,
    setSelectedRole,
  });

  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const selectedEdge =
    edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  const [interactiveMode, setInteractiveMode] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(60);

  useEffect(() => {
    //loads templates from the backend and makes them ready to be diplayed in the GUI
    async function fetchTemplates() {
      try {
        const data = await loadTemplates();
        setTemplates(data.templates);
        setSelectedTemplate(data.templates[0] ?? "");
      } catch {
        alert("Failed to load templates");
      }
    }

    fetchTemplates();
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((nodes) => applyNodeChanges(changes, nodes));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((edges) => applyEdgeChanges(changes, edges));
  }, []);

  const onConnect = useCallback((connection) => {
    setEdges((edges) =>
      addEdge(
        {
          ...connection,
          animated: true,
          label: "link",
        },
        edges
      )
    );
  }, []);

  function buildNetworkEdges(networkId, nodeIds, color, distance = 10) {
    const edges = [];

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        edges.push({
          id: `${networkId}-${nodeIds[i]}-${nodeIds[j]}`,
          source: nodeIds[i],
          target: nodeIds[j],
          label: `${distance}m`,
          type: "straight",
          data: {
            networkId,
            distance,
          },
          style: {
            stroke: color,
            strokeWidth: 4,
          },
          animated: false,
        });
      }
    }

    return edges;
  }

  //ads a new node to the topology, special nodes can be given extra datafields
  function addNode(role = selectedRole) {
    const isBotNet = role === "botnet";

    let size;

    if (isBotNet) {
      const input = prompt("Set botnet size:");
      if (input === null) return;

      size = Number.parseInt(input, 10) || 10;
    }

    const id = isBotNet
      ? `botnet-${nodeId++}`
      : `${role}-${nodeId++}`;

    setNodes((nodes) => [
      ...nodes,
      {
        id,
        type: "roleNode",
        position: {
          x: 150 + Math.random() * 300,
          y: 150 + Math.random() * 200,
        },
        data: {
          label: id,
          role: role,
          networks: [],
          ipAddresses: {},
          ...(isBotNet && { size }),
        },
      },
    ]);
  }

  function deleteSelectedNode() {
    const selectedIds = selectedNodes.map((node) => node.id);
      if (selectedIds.length === 0) return;

      if (selectedIds.includes(inspectedNodeId)) {
        setInspectedNodeId(null);
      }

      setNodes((nodes) =>
        nodes.filter((node) => !selectedIds.includes(node.id))
      );

      setEdges((edges) =>
        edges.filter(
          (edge) =>
            !selectedIds.includes(edge.source) &&
            !selectedIds.includes(edge.target)
        )
      );

      setNetworks((networks) =>
        networks
          .map((network) => ({
            ...network,
            nodes: network.nodes.filter((id) => !selectedIds.includes(id)),
          }))
          .filter((network) => network.nodes.length > 0)
      );

      setTrafficFlows((flows) =>
        flows.filter(
          (flow) =>
            !selectedIds.includes(flow.source) &&
            !selectedIds.includes(flow.destination)
        )
      );

      setSelectedNodes([]);
  }
  //creates an empty network
  function createNetwork() {
    const id = networkId++;
    const networkName = `net${id}`;
    const subnet = `10.${id}.0.0/24`;
    setNetworks((networks) => [
      ...networks,
      {
        id: networkName,
        subnet,
        nodes: [],
        color: networkColors[networks.length % networkColors.length],
      },
    ]);
  }

  //looks at the selcted nodes in the GUI and creates a network that connects them with edges
  function createNetworkFromSelection() {
    if (selectedNodes.length === 0) return;

    const id = networkId++;
    const networkName = `net${id}`;
    const subnet = `10.${id}.0.0/24`;
    const selectedIds = selectedNodes.map((node) => node.id);
    const color = networkColors[networks.length % networkColors.length];

    setNetworks((networks) => [
      ...networks,
      {
        id: networkName,
        subnet,
        nodes: selectedIds,
        color,
      },
    ]);

    setEdges((edges) => [
      ...edges,
      ...buildNetworkEdges(networkName, selectedIds, color),
    ]);

    setNodes((nodes) => {
      const usedIps = [];

      return nodes.map((node) => {
        if (!selectedIds.includes(node.id)) return node;

        const ip = generateUnusedIp(node.data.role, subnet, usedIps);
        usedIps.push(ip);

        return {
          ...node,
          data: {
            ...node.data,
            networks: [...(node.data.networks ?? []), networkName],
            ipAddresses: {
              ...(node.data.ipAddresses ?? {}),
              [networkName]: ip,
            },
          },
        };
      });
    });
  }

  //ads selected network to an allready existing network and generates edges between the selected nodes and the nodes allready in the network
  function addSelectionToNetwork(targetNetworkId) {
    if (selectedNodes.length === 0) return;

    const selectedIds = selectedNodes.map((node) => node.id);
    const network = networks.find((net) => net.id === targetNetworkId);

    if (!network) return;

    const newNodeIds = selectedIds.filter(
      (id) => !network.nodes.includes(id)
    );

    if (newNodeIds.length === 0) return;

    const color = network.color;
    const distance = network.distance ?? 10;

    setNetworks((networks) =>
      networks.map((net) =>
        net.id === targetNetworkId
          ? {
              ...net,
              nodes: Array.from(new Set([...net.nodes, ...newNodeIds])),
            }
          : net
      )
    );

    const edgeNodeIds = [...network.nodes, ...newNodeIds];

    setEdges((edges) => [
      ...edges,
      ...buildNetworkEdges(targetNetworkId, edgeNodeIds, color, distance).filter(
        (newEdge) => !edges.some((edge) => edge.id === newEdge.id)
      ),
    ]);

    setNodes((nodes) => {
      const usedIps = getIpAddressesInNetwork(targetNetworkId, nodes);

      return nodes.map((node) => {
        if (!newNodeIds.includes(node.id)) return node;

        const ip = generateUnusedIp(node.data.role, network.subnet, usedIps);
        usedIps.push(ip);

        return {
          ...node,
          data: {
            ...node.data,
            networks: Array.from(
              new Set([...(node.data.networks ?? []), targetNetworkId])
            ),
            ipAddresses: {
              ...(node.data.ipAddresses ?? {}),
              [targetNetworkId]: ip,
            },
          },
        };
      });
    });
  }

  //removes selected nodes from a given network and deletes any edges connecting them to it
  function removeSelectionFromNetwork(targetNetworkId) {
    if (selectedNodes.length === 0) return;

    const selectedIds = selectedNodes.map((node) => node.id);

    setNetworks((networks) =>
      networks
        .map((net) =>
          net.id === targetNetworkId
            ? {
                ...net,
                nodes: net.nodes.filter((id) => !selectedIds.includes(id)),
              }
            : net
        )
        .filter((net) => net.nodes.length > 0)
    );

    setEdges((edges) =>
      edges.filter(
        (edge) =>
          edge.data?.networkId !== targetNetworkId ||
          (!selectedIds.includes(edge.source) &&
          !selectedIds.includes(edge.target))
      )
    );

    setNodes((nodes) =>
      nodes.map((node) => {
        const shouldRemove =
          selectedIds.includes(node.id) &&
          node.data.networks?.includes(targetNetworkId);

        if (!shouldRemove) return node;

        const remainingIps = { ...(node.data.ipAddresses ?? {}) };
        delete remainingIps[targetNetworkId];

        return {
          ...node,
          data: {
            ...node.data,
            networks: node.data.networks.filter(
              (net) => net !== targetNetworkId
            ),
            ipAddresses: remainingIps,
          },
        };
      })
    );
  }

  //removes a network from the topology and removes any edges from the nodes that shared the network
  function removeNetwork(targetNetworkId) {
    setNetworks((networks) =>
      networks.filter((net) => net.id !== targetNetworkId)
    );

    setEdges((edges) =>
      edges.filter((edge) => edge.data?.networkId !== targetNetworkId)
    );

    setNodes((nodes) =>
      nodes.map((node) => {
        const remainingIps = { ...(node.data.ipAddresses ?? {}) };
        delete remainingIps[targetNetworkId];

        return {
          ...node,
          data: {
            ...node.data,
            networks: (node.data.networks ?? []).filter(
              (net) => net !== targetNetworkId
            ),
            ipAddresses: remainingIps,
          },
        };
      })
    );
  }

  function getCurrentTopology() {
    return serializeTopology({
      nodes,
      edges,
      networks,
      trafficFlows,
      nodeId,
      networkId,
    });
  }

  async function exportTopology() {
    try {
      await saveTopology(getCurrentTopology());
      alert("Topology saved");
    } catch {
      alert("Failed to save topology");
    }
  }

  async function exportTemplate() {
    const name = prompt("Name the new template:");
    if (!name) return;

    try {
      await saveTemplate(name, getCurrentTopology());
      alert("Template saved");
    } catch {
      alert("Failed to save template");
    }
  }

  async function importTopology(template) {
    try {
      const templateJSON = await loadTemplate(template);

      nodeId =
        templateJSON.nextIds?.nodeId ??
        getNextNodeId([
          ...(templateJSON.nodes ?? []),
          ...(templateJSON.botNets ?? []),
        ]);

      networkId =
        templateJSON.nextIds?.networkId ??
        getNextNetworkId(templateJSON.networks ?? []);

      setNodes(buildImportedNodes(templateJSON));
      setEdges(buildImportedEdges(templateJSON));
      setNetworks(templateJSON.networks ?? []);
      setTrafficFlows(templateJSON.trafficFlows ?? []);

      setSelectedNodes([]);
      setInspectedNodeId(null);
    } catch {
      alert("Failed to load template");
    }
  }

  async function runEnvironment() {
    

    try {
      await saveTopology(getCurrentTopology());
      
      const result = await startEnvironment({
        interactive: interactiveMode,
        durationSeconds,
      });
      if (interactiveMode) {
        navigate(`/interactive/${result.runId}`);
      } else {
        navigate(`/run/${result.runId}`);
      }
    } catch (error) {
      alert("Failed to start environment:\n" + error.message);
    }
  }

  function addTrafficFlow(flow) {
    setTrafficFlows((flows) => [
      ...flows,
      {
        id: `traffic-${flows.length + 1}`,
        ...flow,
      },
    ]);
  }

  function updateEdgeDistance(edgeId, distance) {
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              label: `${distance}m`,
              data: {
                ...edge.data,
                distance,
              },
            }
          : edge
      )
    );
  }

  return {
    interactiveMode,
    durationSeconds,
    templates,
    selectedTemplate,
    nodes,
    edges,
    nodeTypes,
    selectedRole,
    selectedNodes,
    selectedEdge,
    networks,
    trafficFlows,
    selectedNode,

    setInteractiveMode,
    setDurationSeconds,
    setSelectedTemplate,
    setSelectedRole,
    setSelectedNodes,
    setInspectedNodeId,
    setSelectedEdgeId,


    onNodesChange,
    onEdgesChange,
    onConnect,

    addNode,
    buildNetworkEdges,
    deleteSelectedNode,
    createNetwork,
    createNetworkFromSelection,
    addSelectionToNetwork,
    removeSelectionFromNetwork,
    removeNetwork,

    exportTopology,
    exportTemplate,
    importTopology,
    runEnvironment,
    addTrafficFlow,
    updateEdgeDistance,
  };
}