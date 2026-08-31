import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import TopologyEditor from "../TopologyEditor";

vi.mock("../../../hooks/useTopologyState", () => ({
  useTopologyState: vi.fn(() => ({
    nodes: [{ id: "node-1" }],
    edges: [{ id: "edge-1" }],
  })),
}));

vi.mock("../Sidebar", () => ({
  default: ({ nodes, edges }) => (
    <div data-testid="sidebar">
      {nodes.length} nodes, {edges.length} edges
    </div>
  ),
}));

vi.mock("../TopologyCanvas", () => ({
  default: ({ nodes, edges }) => (
    <div data-testid="topology-canvas">
      {nodes.length} nodes, {edges.length} edges
    </div>
  ),
}));

describe("TopologyEditor", () => {
  it("passes topology state to the sidebar and canvas", () => {
    render(<TopologyEditor />);

    expect(screen.getByTestId("sidebar")).toHaveTextContent(
      "1 nodes, 1 edges"
    );

    expect(screen.getByTestId("topology-canvas")).toHaveTextContent(
      "1 nodes, 1 edges"
    );
  });
});