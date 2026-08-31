import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import NodeGraphic from "../NodeGraphic";

vi.mock("@xyflow/react", () => ({
  Handle: ({ type }) => <div data-testid={`handle-${type}`} />,
  Position: {
    Top: "top",
  },
}));

vi.mock("../../utils/constants", () => ({
  nodeTypes: {
    pc: {
      icon: "💻",
      label: "PC",
    },
    router: {
      icon: "📡",
      label: "Router",
    },
  },
}));

describe("NodeGraphic", () => {
  it("renders node information", () => {
    const data = {
      role: "pc",
      label: "PC 1",
      networks: ["network-1", "network-2"],
    };

    render(<NodeGraphic data={data} />);

    expect(screen.getByText("PC 1")).toBeInTheDocument();
    expect(screen.getByText("💻")).toBeInTheDocument();
    expect(screen.getByText("PC")).toBeInTheDocument();
    expect(
      screen.getByText("network-1, network-2")
    ).toBeInTheDocument();
  });

  it("does not render network information when no networks exist", () => {
    const data = {
      role: "pc",
      label: "PC 1",
      networks: [],
    };

    render(<NodeGraphic data={data} />);

    expect(
      screen.queryByText(/network-/)
    ).not.toBeInTheDocument();
  });

  it("uses fallback values for an unknown role", () => {
    const data = {
      role: "unknown",
      label: "Unknown device",
      networks: [],
    };

    render(<NodeGraphic data={data} />);

    expect(screen.getByText("⚙️")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("renders both source and target handles", () => {
    const data = {
      role: "router",
      label: "Router 1",
      networks: [],
    };

    render(<NodeGraphic data={data} />);

    expect(screen.getByTestId("handle-target")).toBeInTheDocument();
    expect(screen.getByTestId("handle-source")).toBeInTheDocument();
  });
});