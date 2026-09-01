import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTopologyState } from "../useTopologyState";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock("../../api/templateApi", () => ({
  loadTemplates: vi.fn(),
  loadTemplate: vi.fn(),
  saveTemplate: vi.fn(),
  saveTopology: vi.fn(),
}));

vi.mock("../../api/runnerApi", () => ({
  startEnvironment: vi.fn(),
}));

vi.mock("../../utils/ipUtils", () => ({
  generateUnusedIp: vi.fn(),
  getIpAddressesInNetwork: vi.fn(),
}));

vi.mock("../../utils/constants", () => ({
  initialNodes: [],
  initialEdges: [],
  networkColors: ["red", "blue", "green"],
}));

vi.mock("../../components/topology/NodeGraphic", () => ({
  default: () => null,
}));

import {
  loadTemplates,
} from "../../api/templateApi";

import { startEnvironment } from "../../api/runnerApi";

import {
  generateUnusedIp,
  getIpAddressesInNetwork,
} from "../../utils/ipUtils";

//testing template interactions

describe("useTopologyState", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    loadTemplates.mockResolvedValue({
      templates: [],
    });

    generateUnusedIp.mockReturnValue("10.1.0.10");

    getIpAddressesInNetwork.mockReturnValue([]);
  });

  it("starts with the expected default state", async () => {
    const { result } = renderHook(() => useTopologyState());

    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.networks).toEqual([]);
    expect(result.current.trafficFlows).toEqual([]);

    expect(result.current.selectedRole).toBe("pc");
    expect(result.current.interactiveMode).toBe(false);
    expect(result.current.durationSeconds).toBe(60);

    await waitFor(() => {
      expect(loadTemplates).toHaveBeenCalled();
    });
  });

  it("loads available templates", async () => {
    loadTemplates.mockResolvedValue({
      templates: ["basic", "routing"],
    });

    const { result } = renderHook(() => useTopologyState());

    await waitFor(() => {
      expect(result.current.templates).toEqual([
        "basic",
        "routing",
      ]);
    });

    expect(result.current.selectedTemplate).toBe("basic");
  });

  //testing node interactions

  it("adds a normal node", async () => {
    const { result } = renderHook(() => useTopologyState());

    await waitFor(() => {
      expect(loadTemplates).toHaveBeenCalled();
    });

    act(() => {
      result.current.addNode("pc");
    });

    expect(result.current.nodes).toHaveLength(1);

    expect(result.current.nodes[0]).toMatchObject({
      type: "roleNode",
      data: {
        role: "pc",
        networks: [],
        ipAddresses: {},
      },
    });
  });

  it("adds a botnet with a configured size", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("25");

    const { result } = renderHook(() => useTopologyState());

    await waitFor(() => {
      expect(loadTemplates).toHaveBeenCalled();
    });

    act(() => {
      result.current.addNode("botnet");
    });

    expect(result.current.nodes).toHaveLength(1);

    expect(result.current.nodes[0].data).toMatchObject({
      role: "botnet",
      size: 25,
    });
  });

  it("does not add a botnet when the prompt is cancelled", async () => {
    vi.spyOn(window, "prompt").mockReturnValue(null);

    const { result } = renderHook(() => useTopologyState());

    await waitFor(() => {
      expect(loadTemplates).toHaveBeenCalled();
    });

    act(() => {
      result.current.addNode("botnet");
    });

    expect(result.current.nodes).toHaveLength(0);
  });

  it("adds a traffic flow with an automatically generated ID", async () => {
    const { result } = renderHook(() => useTopologyState());

    await waitFor(() => {
      expect(loadTemplates).toHaveBeenCalled();
    });

    act(() => {
      result.current.addTrafficFlow({
        source: "pc1",
        destination: "pc2",
        type: "icmp",
        duration: 20,
      });
    });

    expect(result.current.trafficFlows).toEqual([
      {
        id: "traffic-1",
        source: "pc1",
        destination: "pc2",
        type: "icmp",
        duration: 20,
      },
    ]);
  });

  it("updates the distance of an edge", () => {
    const { result } = renderHook(() => useTopologyState());

    act(() => {
      result.current.onConnect({
        id: "edge-1",
        source: "pc-1",
        target: "router-3",
        data: {
          networkId: "net1",
          distance: 10,
        },
        label: "10m",
      });
    });

    expect(result.current.edges).toHaveLength(1);

    act(() => {
      result.current.updateEdgeDistance(
        result.current.edges[0].id,
        500
      );
    });

    expect(result.current.edges[0]).toMatchObject({
      label: "500m",
      data: {
        distance: 500,
      },
    });
  });

  //testing network interactions

  it("creates a network from selected nodes", async () => {
    generateUnusedIp
        .mockReturnValueOnce("10.1.0.10")
        .mockReturnValueOnce("10.1.0.11");

    const { result } = renderHook(() => useTopologyState());

    await waitFor(() => {
        expect(loadTemplates).toHaveBeenCalled();
    });

    act(() => {
        result.current.addNode("pc");
        result.current.addNode("pc");
    });

    const nodes = result.current.nodes;

    act(() => {
        result.current.setSelectedNodes(nodes);
    });

    act(() => {
        result.current.createNetworkFromSelection();
    });

    expect(result.current.networks).toHaveLength(1);

    expect(result.current.networks[0].nodes).toEqual([
        nodes[0].id,
        nodes[1].id,
    ]);

    expect(result.current.edges).toHaveLength(1);

    expect(
        result.current.nodes[0].data.networks
    ).toHaveLength(1);

    expect(
        result.current.nodes[1].data.networks
    ).toHaveLength(1);
    });

    it("builds an edge between every pair of nodes in a network", async () => {
        const { result } = renderHook(() => useTopologyState());

        await waitFor(() => {
            expect(loadTemplates).toHaveBeenCalled();
        });

        const edges = result.current.buildNetworkEdges(
            "net1",
            ["pc1", "pc2", "pc3"],
            "red",
            100
        );

        expect(edges).toHaveLength(3);

        expect(edges).toEqual(
            expect.arrayContaining([
            expect.objectContaining({
                source: "pc1",
                target: "pc2",
            }),
            expect.objectContaining({
                source: "pc1",
                target: "pc3",
            }),
            expect.objectContaining({
                source: "pc2",
                target: "pc3",
            }),
            ])
        );
    });

    //testing navigation when running environment

    it("navigates to the normal run page", async () => {
        startEnvironment.mockResolvedValue({
            runId: "run-123",
        });

        const { result } = renderHook(() => useTopologyState());

        await waitFor(() => {
            expect(loadTemplates).toHaveBeenCalled();
        });

        await act(async () => {
            await result.current.runEnvironment();
        });

        expect(startEnvironment).toHaveBeenCalledWith({
            interactive: false,
            durationSeconds: 60,
        });

        expect(navigate).toHaveBeenCalledWith(
            "/run/run-123"
        );
    });

    it("navigates to interactive mode when enabled", async () => {
        startEnvironment.mockResolvedValue({
            runId: "run-456",
        });

        const { result } = renderHook(() => useTopologyState());

        await waitFor(() => {
            expect(loadTemplates).toHaveBeenCalled();
        });

        act(() => {
            result.current.setInteractiveMode(true);
        });

        await act(async () => {
            await result.current.runEnvironment();
        });

        expect(startEnvironment).toHaveBeenCalledWith({
            interactive: true,
            durationSeconds: 60,
        });

        expect(navigate).toHaveBeenCalledWith(
            "/interactive/run-456"
        );
    });
});