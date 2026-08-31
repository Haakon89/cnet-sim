import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import NodeActionForm from "../NodeActions";

describe("NodeActionForm", () => {
  const config = {
    title: "Create traffic",
    typeLabel: "Traffic type",
    options: [
      { value: "icmp", label: "ICMP" },
      { value: "tcp", label: "TCP" },
    ],
    buttonText: "Add traffic",
  };

  const sourceIps = [
    {
      networkId: "network-1",
      ip: "10.1.0.10",
    },
    {
      networkId: "network-2",
      ip: "10.2.0.10",
    },
  ];

  const destinationOptions = [
    {
      nodeId: "pc2",
      networkId: "network-1",
      ip: "10.1.0.11",
    },
    {
      nodeId: "router1",
      networkId: "network-2",
      ip: "10.2.0.2",
    },
  ];

  function renderForm(overrides = {}) {
    const props = {
      config,
      trafficType: "icmp",
      setTrafficType: vi.fn(),
      sourceIp: "",
      setSourceIp: vi.fn(),
      destinationIp: "",
      setDestinationIp: vi.fn(),
      duration: 20,
      setDuration: vi.fn(),
      sourceIps,
      destinationOptions,
      onSubmit: vi.fn(),
      ...overrides,
    };

    render(<NodeActionForm {...props} />);

    return props;
  }

  it("renders the form contents", () => {
    renderForm();

    expect(screen.getByText("Create traffic")).toBeInTheDocument();
    expect(screen.getByText("Traffic type")).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: "ICMP" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: "TCP" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "10.1.0.10 (network-1)",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "10.1.0.11 - pc2 (network-1)",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Duration: 20 seconds")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Add traffic" })
    ).toBeInTheDocument();
  });

  it("updates the traffic type", () => {
    const props = renderForm();

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[0], {
      target: {
        value: "tcp",
      },
    });

    expect(props.setTrafficType).toHaveBeenCalledWith("tcp");
  });

  it("updates the source IP and clears the destination IP", () => {
    const props = renderForm();

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[1], {
      target: {
        value: "10.1.0.10",
      },
    });

    expect(props.setSourceIp).toHaveBeenCalledWith("10.1.0.10");

    expect(props.setDestinationIp).toHaveBeenCalledWith("");
  });

  it("updates the destination IP", () => {
    const props = renderForm();

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[2], {
      target: {
        value: "10.1.0.11",
      },
    });

    expect(props.setDestinationIp).toHaveBeenCalledWith(
      "10.1.0.11"
    );
  });

  it("updates the duration as a number", () => {
    const props = renderForm();

    const slider = screen.getByRole("slider");

    fireEvent.change(slider, {
      target: {
        value: "45",
      },
    });

    expect(props.setDuration).toHaveBeenCalledWith(45);
  });

  it("calls onSubmit when the button is clicked", () => {
    const props = renderForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add traffic",
      })
    );

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });
});