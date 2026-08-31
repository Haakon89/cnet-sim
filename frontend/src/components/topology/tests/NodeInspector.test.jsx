import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import NodeInspector from "../NodeInspector";

vi.mock("../NodeActions", () => ({
  default: ({
    config,
    trafficType,
    setTrafficType,
    setSourceIp,
    setDestinationIp,
    duration,
    setDuration,
    sourceIps,
    destinationOptions,
    onSubmit,
  }) => (
    <div data-testid="node-action-form">
      <span data-testid="config-title">{config.title}</span>
      <span data-testid="traffic-type">{trafficType}</span>
      <span data-testid="duration">{duration}</span>

      <button onClick={() => setTrafficType("tcp")}>
        Set TCP
      </button>

      <button onClick={() => setSourceIp("10.1.0.10")}>
        Set source
      </button>

      <button onClick={() => setDestinationIp("10.1.0.20")}>
        Set destination
      </button>

      <button onClick={() => setDuration(30)}>
        Set duration
      </button>

      <button onClick={onSubmit}>
        Submit
      </button>

      {sourceIps.map((source) => (
        <span key={source.ip}>
          source:{source.ip}
        </span>
      ))}

      {destinationOptions.map((destination) => (
        <span key={destination.ip}>
          destination:{destination.ip}
        </span>
      ))}
    </div>
  ),
}));

vi.mock("../../../utils/constants", () => ({
  nodeTypes: {
    pc: {
      traffic: "standard",
    },
    router: {
      traffic: null,
    },
    botnet: {
      traffic: "attack",
    },
  },

  ROLE_ACTION_CONFIG: {
    standard: {
      title: "Create traffic",
    },
    attack: {
      title: "Create attack",
    },
  },

  ALLOWED_DESTINATION_ROLES: {
    icmp: ["all"],
    tcp: ["pc"],
    ddos: ["pc"],
  },
}));

describe("NodeInspector", () => {
  const pc1 = {
    id: "pc1",
    data: {
      role: "pc",
      networks: ["network-1"],
      ipAddresses: {
        "network-1": "10.1.0.10",
      },
    },
  };

  const pc2 = {
    id: "pc2",
    data: {
      role: "pc",
      networks: ["network-1"],
      ipAddresses: {
        "network-1": "10.1.0.20",
      },
    },
  };

  const router = {
    id: "router1",
    data: {
      role: "router",
      networks: ["network-1"],
      ipAddresses: {
        "network-1": "10.1.0.2",
      },
    },
  };

  function renderInspector(overrides = {}) {
    const props = {
      node: pc1,
      nodes: [pc1, pc2, router],
      trafficFlows: [],
      onAddTraffic: vi.fn(),
      ...overrides,
    };

    render(<NodeInspector {...props} />);

    return props;
  }

  it("renders basic node information", () => {
    renderInspector();

    expect(screen.getByText("Selected node")).toBeInTheDocument();
    expect(screen.getByText("pc1")).toBeInTheDocument();
    expect(screen.getByText("pc")).toBeInTheDocument();
    expect(screen.getByText("network-1")).toBeInTheDocument();

    expect(
      screen.getByText("network-1: 10.1.0.10")
    ).toBeInTheDocument();
  });

  it("uses icmp as the default traffic type for standard nodes", () => {
    renderInspector();

    expect(
      screen.getByTestId("traffic-type")
    ).toHaveTextContent("icmp");
  });

  it("uses ddos as the default traffic type for attack nodes", () => {
    const botnet = {
      id: "botnet1",
      data: {
        role: "botnet",
        size: 20,
        networks: ["network-1"],
        ipAddresses: {
          "network-1": "10.1.0.30",
        },
      },
    };

    renderInspector({
      node: botnet,
      nodes: [botnet, pc2],
    });

    expect(
      screen.getByTestId("traffic-type")
    ).toHaveTextContent("ddos");
  });

  it("shows the botnet size for botnet nodes", () => {
    const botnet = {
      id: "botnet1",
      data: {
        role: "botnet",
        size: 20,
        networks: ["network-1"],
        ipAddresses: {},
      },
    };

    renderInspector({
      node: botnet,
      nodes: [botnet, pc2],
    });

    expect(screen.getByText("Botnet size:")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("does not include the selected node as a destination", () => {
    renderInspector();

    expect(
      screen.queryByText("destination:10.1.0.10")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("destination:10.1.0.20")
    ).toBeInTheDocument();
  });

  it("filters destination nodes based on allowed roles", () => {
    renderInspector();

    fireEvent.click(
      screen.getByRole("button", { name: "Set TCP" })
    );

    expect(
      screen.getByText("destination:10.1.0.20")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("destination:10.1.0.2")
    ).not.toBeInTheDocument();
  });

  it("does not add traffic when source or destination is missing", () => {
    const props = renderInspector();

    fireEvent.click(
      screen.getByRole("button", { name: "Submit" })
    );

    expect(props.onAddTraffic).not.toHaveBeenCalled();
  });

  it("adds traffic with the correct values", () => {
    const props = renderInspector();

    fireEvent.click(
      screen.getByRole("button", { name: "Set source" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Set destination" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Set duration" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Submit" })
    );

    expect(props.onAddTraffic).toHaveBeenCalledTimes(1);

    expect(props.onAddTraffic).toHaveBeenCalledWith({
      source: "pc1",
      sourceIp: "10.1.0.10",
      destination: "pc2",
      destinationIp: "10.1.0.20",
      type: "icmp",
      duration: 30,
    });
  });

  it("resets the form after adding traffic", () => {
    renderInspector();

    fireEvent.click(
      screen.getByRole("button", { name: "Set source" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Set destination" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Set duration" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Submit" })
    );

    expect(
      screen.getByTestId("duration")
    ).toHaveTextContent("60");
  });

  it("shows traffic originating from the selected node", () => {
    const trafficFlows = [
      {
        id: "flow-1",
        source: "pc1",
        sourceIp: "10.1.0.10",
        destination: "pc2",
        destinationIp: "10.1.0.20",
        type: "icmp",
        duration: 20,
      },
      {
        id: "flow-2",
        source: "pc2",
        destination: "pc1",
        type: "tcp",
        duration: 30,
      },
    ];

    renderInspector({
      trafficFlows,
    });

    expect(
      screen.getByText("Traffic from this node")
    ).toBeInTheDocument();

    const icmpElements = screen.getAllByText("icmp");

    expect(
      icmpElements.some((element) => element.tagName === "STRONG")
    ).toBe(true);

    expect(
      screen.getByText("10.1.0.10 → 10.1.0.20 (20s)")
    ).toBeInTheDocument();

    expect(screen.queryByText("tcp")).not.toBeInTheDocument();
  });
});