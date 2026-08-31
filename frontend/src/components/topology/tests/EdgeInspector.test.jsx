import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import EdgeInspector from "../EdgeInspector";

describe("EdgeInspector", () => {
  const nodes = [
    {
      id: "node-1",
      data: {
        label: "PC 1",
      },
    },
    {
      id: "node-2",
      data: {
        label: "Router 1",
      },
    },
  ];

  const edge = {
    id: "edge-1",
    source: "node-1",
    target: "node-2",
    data: {
      networkId: "network-1",
      distance: 500,
    },
  };

  it("renders nothing when no edge is provided", () => {
    const { container } = render(
      <EdgeInspector
        edge={null}
        nodes={nodes}
        onUpdateDistance={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the selected edge information", () => {
    render(
      <EdgeInspector
        edge={edge}
        nodes={nodes}
        onUpdateDistance={vi.fn()}
      />
    );

    expect(screen.getByText("Selected edge")).toBeInTheDocument();
    expect(screen.getByText("edge-1")).toBeInTheDocument();
    expect(screen.getByText("network-1")).toBeInTheDocument();
    expect(screen.getByText("PC 1")).toBeInTheDocument();
    expect(screen.getByText("Router 1")).toBeInTheDocument();
    expect(screen.getByText("Distance 500 m")).toBeInTheDocument();
  });

  it("falls back to node IDs when labels are unavailable", () => {
    const edgeWithUnknownNodes = {
      id: "edge-2",
      source: "unknown-source",
      target: "unknown-target",
      data: {
        networkId: "network-2",
      },
    };

    render(
      <EdgeInspector
        edge={edgeWithUnknownNodes}
        nodes={nodes}
        onUpdateDistance={vi.fn()}
      />
    );

    expect(screen.getByText("unknown-source")).toBeInTheDocument();
    expect(screen.getByText("unknown-target")).toBeInTheDocument();
  });

  it("shows Unknown when the network ID is missing", () => {
    const edgeWithoutNetwork = {
      ...edge,
      data: {
        distance: 500,
      },
    };

    render(
      <EdgeInspector
        edge={edgeWithoutNetwork}
        nodes={nodes}
        onUpdateDistance={vi.fn()}
      />
    );

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("uses a default distance of 10 when distance is missing", () => {
    const edgeWithoutDistance = {
      ...edge,
      data: {
        networkId: "network-1",
      },
    };

    render(
      <EdgeInspector
        edge={edgeWithoutDistance}
        nodes={nodes}
        onUpdateDistance={vi.fn()}
      />
    );

    expect(screen.getByText("Distance 10 m")).toBeInTheDocument();

    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("10");
  });

  it("calls onUpdateDistance when the distance slider changes", () => {
    const onUpdateDistance = vi.fn();

    render(
      <EdgeInspector
        edge={edge}
        nodes={nodes}
        onUpdateDistance={onUpdateDistance}
      />
    );

    const slider = screen.getByRole("slider");

    fireEvent.change(slider, {
      target: {
        value: "1200",
      },
    });

    expect(onUpdateDistance).toHaveBeenCalledTimes(1);
    expect(onUpdateDistance).toHaveBeenCalledWith(
      "edge-1",
      1200
    );
  });

  it("stops click events from propagating", () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <EdgeInspector
          edge={edge}
          nodes={nodes}
          onUpdateDistance={vi.fn()}
        />
      </div>
    );

    fireEvent.click(screen.getByText("Selected edge"));

    expect(parentClick).not.toHaveBeenCalled();
  });

  it("stops mouse down events from propagating", () => {
    const parentMouseDown = vi.fn();

    render(
      <div onMouseDown={parentMouseDown}>
        <EdgeInspector
          edge={edge}
          nodes={nodes}
          onUpdateDistance={vi.fn()}
        />
      </div>
    );

    fireEvent.mouseDown(screen.getByText("Selected edge"));

    expect(parentMouseDown).not.toHaveBeenCalled();
  });
});