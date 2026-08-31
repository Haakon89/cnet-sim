import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import TopologyCanvas from "../TopologyCanvas";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({
    onSelectionChange,
  }) => (
    <div>
      <button
        onClick={() =>
          onSelectionChange({
            nodes: [{ id: "node-1" }],
            edges: [],
          })
        }
      >
        Select one node
      </button>

      <button
        onClick={() =>
          onSelectionChange({
            nodes: [
              { id: "node-1" },
              { id: "node-2" },
            ],
            edges: [],
          })
        }
      >
        Select multiple nodes
      </button>

      <button
        onClick={() =>
          onSelectionChange({
            nodes: [],
            edges: [{ id: "edge-1" }],
          })
        }
      >
        Select one edge
      </button>

      <button
        onClick={() =>
          onSelectionChange({
            nodes: [],
            edges: [
              { id: "edge-1" },
              { id: "edge-2" },
            ],
          })
        }
      >
        Select multiple edges
      </button>

      <button
        onClick={() =>
          onSelectionChange({
            nodes: [],
            edges: [],
          })
        }
      >
        Clear selection
      </button>
    </div>
  ),

  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
}));

describe("TopologyCanvas", () => {
  function renderCanvas(overrides = {}) {
    const props = {
      nodes: [],
      edges: [],
      nodeTypes: {},
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),

      setSelectedNodes: vi.fn(),
      setInspectedNodeId: vi.fn(),
      setSelectedEdgeId: vi.fn(),

      ...overrides,
    };

    render(<TopologyCanvas {...props} />);

    return props;
  }

  it("selects and inspects a single node", () => {
    const props = renderCanvas();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Select one node",
      })
    );

    expect(props.setSelectedNodes).toHaveBeenCalledWith([
      { id: "node-1" },
    ]);

    expect(
      props.setInspectedNodeId
    ).toHaveBeenCalledWith("node-1");

    expect(
      props.setSelectedEdgeId
    ).toHaveBeenCalledWith(null);
  });

  it("does not inspect a node when multiple nodes are selected", () => {
    const props = renderCanvas();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Select multiple nodes",
      })
    );

    expect(props.setSelectedNodes).toHaveBeenCalledWith([
      { id: "node-1" },
      { id: "node-2" },
    ]);

    expect(
      props.setInspectedNodeId
    ).toHaveBeenCalledWith(null);

    expect(
      props.setSelectedEdgeId
    ).toHaveBeenCalledWith(null);
  });

  it("selects a single edge and clears the inspected node", () => {
    const props = renderCanvas();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Select one edge",
      })
    );

    expect(props.setSelectedNodes).toHaveBeenCalledWith([]);

    expect(
      props.setSelectedEdgeId
    ).toHaveBeenCalledWith("edge-1");

    expect(
      props.setInspectedNodeId
    ).toHaveBeenCalledWith(null);
  });

  it("does not select an edge when multiple edges are selected", () => {
    const props = renderCanvas();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Select multiple edges",
      })
    );

    expect(
      props.setSelectedEdgeId
    ).toHaveBeenCalledWith(null);
  });

  it("clears inspected node and selected edge when selection is empty", () => {
    const props = renderCanvas();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear selection",
      })
    );

    expect(props.setSelectedNodes).toHaveBeenCalledWith([]);

    expect(
      props.setInspectedNodeId
    ).toHaveBeenCalledWith(null);

    expect(
      props.setSelectedEdgeId
    ).toHaveBeenCalledWith(null);
  });
});