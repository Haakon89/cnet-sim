import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import Sidebar from "../Sidebar";

vi.mock("../NodeInspector", () => ({
  default: ({ node }) => (
    <div data-testid="node-inspector">
      Node inspector: {node.id}
    </div>
  ),
}));

vi.mock("../EdgeInspector", () => ({
  default: ({ edge }) => (
    <div data-testid="edge-inspector">
      Edge inspector: {edge.id}
    </div>
  ),
}));

vi.mock("../../utils/constants", () => ({
  nodeTypes: {
    pc: {
      label: "PC",
    },
    router: {
      label: "Router",
    },
  },
}));

describe("Sidebar", () => {
  function renderSidebar(overrides = {}) {
    const props = {
      interactiveMode: false,
      setInteractiveMode: vi.fn(),

      durationSeconds: 60,
      setDurationSeconds: vi.fn(),

      selectedTemplate: "basic",
      setSelectedTemplate: vi.fn(),
      importTopology: vi.fn(),

      selectedRole: "pc",
      setSelectedRole: vi.fn(),

      selectedEdge: null,
      updateEdgeDistance: vi.fn(),

      addNode: vi.fn(),
      createNetworkFromSelection: vi.fn(),

      exportTemplate: vi.fn(),
      runEnvironment: vi.fn(),

      selectedNode: null,

      templates: ["basic", "advanced"],

      nodes: [],
      trafficFlows: [],
      addTrafficFlow: vi.fn(),

      networks: [
        {
          id: "network-1",
          subnet: "10.1.0.0/24",
          nodes: ["pc1", "pc2"],
        },
      ],

      addSelectionToNetwork: vi.fn(),
      removeSelectionFromNetwork: vi.fn(),
      removeNetwork: vi.fn(),

      ...overrides,
    };

    render(<Sidebar {...props} />);

    return props;
  }

  it("renders the main sidebar sections", () => {
    renderSidebar();

    expect(screen.getByText("Network Builder")).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("Nodes")).toBeInTheDocument();
    expect(screen.getByText("Environment")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText("Networks")).toBeInTheDocument();
  });

  it("enables interactive mode", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", { name: "ON" })
    );

    expect(props.setInteractiveMode).toHaveBeenCalledWith(true);
  });

  it("disables interactive mode", () => {
    const props = renderSidebar({
      interactiveMode: true,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "OFF" })
    );

    expect(props.setInteractiveMode).toHaveBeenCalledWith(false);
  });

  it("shows the runtime slider when interactive mode is disabled", () => {
    renderSidebar({
      interactiveMode: false,
      durationSeconds: 60,
    });

    expect(
      screen.getByText("Run time: 60 seconds")
    ).toBeInTheDocument();

    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("hides the runtime slider when interactive mode is enabled", () => {
    renderSidebar({
      interactiveMode: true,
    });

    expect(
      screen.queryByText(/Run time:/)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("slider")
    ).not.toBeInTheDocument();
  });

  it("updates the environment duration", () => {
    const props = renderSidebar();

    const slider = screen.getByRole("slider");

    fireEvent.change(slider, {
      target: {
        value: "90",
      },
    });

    expect(props.setDurationSeconds).toHaveBeenCalledWith(90);
  });

  it("updates the selected template", () => {
    const props = renderSidebar();

    const selects = screen.getAllByRole("combobox");
    const templateSelect = selects[0];

    fireEvent.change(templateSelect, {
      target: {
        value: "advanced",
      },
    });

    expect(props.setSelectedTemplate).toHaveBeenCalledWith(
      "advanced"
    );
  });

  it("loads the selected template", () => {
    const props = renderSidebar({
      selectedTemplate: "advanced",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Load template",
      })
    );

    expect(props.importTopology).toHaveBeenCalledWith(
      "advanced"
    );
  });

  it("updates the selected node role", () => {
    const props = renderSidebar();

    const selects = screen.getAllByRole("combobox");
    const roleSelect = selects[1];

    fireEvent.change(roleSelect, {
      target: {
        value: "router",
      },
    });

    expect(props.setSelectedRole).toHaveBeenCalledWith(
      "router"
    );
  });

  it("adds a node", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add node",
      })
    );

    expect(props.addNode).toHaveBeenCalledTimes(1);
  });

  it("creates a network from the current selection", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create network from selection",
      })
    );

    expect(
      props.createNetworkFromSelection
    ).toHaveBeenCalledTimes(1);
  });

  it("exports the current topology as a template", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save as template",
      })
    );

    expect(props.exportTemplate).toHaveBeenCalledTimes(1);
  });

  it("runs the network environment", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Run Network Environment",
      })
    );

    expect(props.runEnvironment).toHaveBeenCalledTimes(1);
  });

  it("renders NodeInspector when a node is selected", () => {
    renderSidebar({
      selectedNode: {
        id: "pc1",
        data: {
          role: "pc",
        },
      },
    });

    expect(
      screen.getByTestId("node-inspector")
    ).toHaveTextContent("pc1");
  });

  it("renders EdgeInspector when an edge is selected", () => {
    renderSidebar({
      selectedEdge: {
        id: "edge-1",
      },
    });

    expect(
      screen.getByTestId("edge-inspector")
    ).toHaveTextContent("edge-1");
  });

  it("renders network information", () => {
    renderSidebar();

    expect(screen.getByText("network-1")).toBeInTheDocument();
    expect(screen.getByText("10.1.0.0/24")).toBeInTheDocument();
    expect(screen.getByText("2 nodes")).toBeInTheDocument();
  });

  it("adds the current selection to a network", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add to network",
      })
    );

    expect(
      props.addSelectionToNetwork
    ).toHaveBeenCalledWith("network-1");
  });

  it("removes the current selection from a network", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove from network",
      })
    );

    expect(
      props.removeSelectionFromNetwork
    ).toHaveBeenCalledWith("network-1");
  });

  it("removes a network", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove network",
      })
    );

    expect(props.removeNetwork).toHaveBeenCalledWith(
      "network-1"
    );
  });
});