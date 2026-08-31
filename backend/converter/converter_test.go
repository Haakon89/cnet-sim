package main

import (
	"encoding/json"
	"math"
	"os"
	"slices"
	"strings"
	"testing"
)

func TestCalculateDelay(t *testing.T) {
	tests := []struct {
		name     string
		distance int
		want     float64
	}{
		{
			name:     "zero distance",
			distance: 0,
			want:     0,
		},
		{
			name:     "10 meters",
			distance: 10,
			want:     0.00005,
		},
		{
			name:     "200 kilometers",
			distance: 200_000,
			want:     1,
		},
		{
			name:     "1000 kilometers",
			distance: 1_000_000,
			want:     5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateDelay(tt.distance)

			if math.Abs(got-tt.want) > 0.000001 {
				t.Errorf(
					"calculateDelay(%d) = %f, want %f",
					tt.distance,
					got,
					tt.want,
				)
			}
		})
	}
}

func TestCalculateJitter(t *testing.T) {
	tests := []struct {
		name  string
		delay float64
		want  float64
	}{
		{
			name:  "normal jitter",
			delay: 10,
			want:  1,
		},
		{
			name:  "minimum jitter applied",
			delay: 0.05,
			want:  0.01,
		},
		{
			name:  "zero delay",
			delay: 0,
			want:  0.01,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateJitter(tt.delay)

			if got != tt.want {
				t.Errorf(
					"calculateJitter(%f) = %f, want %f",
					tt.delay,
					got,
					tt.want,
				)
			}
		})
	}
}

func TestAssignIPs(t *testing.T) {
	topo := Topology{
		Nodes: []Node{
			{
				ID:       "pc-1",
				Role:     "pc",
				Networks: []string{"net1"},
				IPAddresses: map[string]string{
					"net1": "10.1.0.10",
				},
			},
			{
				ID:       "router-3",
				Role:     "router",
				Networks: []string{"net1", "net2"},
				IPAddresses: map[string]string{
					"net1": "10.1.0.2",
					"net2": "10.2.0.2",
				},
			},
		},
		Networks: []Network{
			{
				ID:     "net1",
				Subnet: "10.1.0.0/24",
				Nodes:  []string{"pc-1", "router-3"},
			},
			{
				ID:     "net2",
				Subnet: "10.2.0.0/24",
				Nodes:  []string{"router-3"},
			},
		},
	}

	nodeByID := map[string]Node{}

	for _, node := range topo.Nodes {
		nodeByID[node.ID] = node
	}

	got, err := AssignIPs(topo, nodeByID)
	if err != nil {
		t.Fatalf("AssignIPs returned unexpected error: %v", err)
	}

	if got["pc-1"]["net1"] != "10.1.0.10" {
		t.Errorf(
			"pc-1 net1 IP = %s, want 10.1.0.10",
			got["pc-1"]["net1"],
		)
	}

	if got["router-3"]["net2"] != "10.2.0.2" {
		t.Errorf(
			"router-3 net2 IP = %s, want 10.2.0.2",
			got["router-3"]["net2"],
		)
	}
}

func TestAssignIPsMissingNodeReturnsError(t *testing.T) {
	topo := Topology{
		Networks: []Network{
			{
				ID:    "net1",
				Nodes: []string{"does-not-exist"},
			},
		},
	}

	nodeByID := map[string]Node{}

	got, err := AssignIPs(topo, nodeByID)

	if err == nil {
		t.Fatal("expected AssignIPs to return an error for missing node")
	}

	if got != nil {
		t.Errorf("expected nil result, got %v", got)
	}

	if !strings.Contains(err.Error(), "does-not-exist") {
		t.Errorf(
			"error %q does not mention missing node",
			err.Error(),
		)
	}
}

func TestAssignIPsMissingIPReturnsError(t *testing.T) {
	node := Node{
		ID:          "pc-1",
		Role:        "pc",
		IPAddresses: map[string]string{},
	}

	topo := Topology{
		Nodes: []Node{node},
		Networks: []Network{
			{
				ID:    "net1",
				Nodes: []string{"pc-1"},
			},
		},
	}

	nodeByID := map[string]Node{
		"pc-1": node,
	}

	got, err := AssignIPs(topo, nodeByID)

	if err == nil {
		t.Fatal("expected AssignIPs to return an error for missing IP")
	}

	if got != nil {
		t.Errorf("expected nil result, got %v", got)
	}

	if !strings.Contains(err.Error(), "missing IP") {
		t.Errorf(
			"unexpected error: %v",
			err,
		)
	}
}

func TestFindGateway(t *testing.T) {
	topo := loadTopology(t, "testdata/simple-topology.json")

	result, err := ConvertTopology(topo)
	if err != nil {
		t.Fatalf("ConvertTopology returned unexpected error: %v", err)
	}

	tests := []struct {
		nodeID string
		want   string
	}{
		{"pc-1", "10.1.0.2"},
		{"pc-2", "10.2.0.2"},
	}

	for _, tt := range tests {
		t.Run(tt.nodeID, func(t *testing.T) {
			got := FindGateway(
				tt.nodeID,
				topo,
				result.NodeByID,
				result.IPByNodeNet,
			)

			if got != tt.want {
				t.Errorf(
					"FindGateway(%s) = %s, want %s",
					tt.nodeID,
					got,
					tt.want,
				)
			}
		})
	}
}

func TestFirstSharedNetwork(t *testing.T) {
	ips := map[string]map[string]string{
		"router1": {
			"net1": "10.1.0.2",
			"net2": "10.2.0.2",
		},
		"router2": {
			"net2": "10.2.0.3",
			"net3": "10.3.0.2",
		},
	}

	got := FirstSharedNetwork("router1", "router2", ips)

	if got != "net2" {
		t.Errorf("got %q, want %q", got, "net2")
	}
}

func TestFirstSharedNetworkNone(t *testing.T) {
	ips := map[string]map[string]string{
		"router1": {
			"net1": "10.1.0.2",
		},
		"router2": {
			"net2": "10.2.0.2",
		},
	}

	got := FirstSharedNetwork("router1", "router2", ips)

	if got != "" {
		t.Errorf("got %q, want empty string", got)
	}
}

func TestBuildRoutes(t *testing.T) {
	topo := loadTopology(t, "testdata/routed-topology.json")

	result, err := ConvertTopology(topo)
	if err != nil {
		t.Fatalf("ConvertTopology returned unexpected error: %v", err)
	}

	r1Routes := result.RoutesByRouter["router-1"]

	want := "10.3.0.0/24 via 10.2.0.3"

	if !slices.Contains(r1Routes, want) {
		t.Errorf(
			"router-1 routes = %v, want route %q",
			r1Routes,
			want,
		)
	}
}

func TestSanitizeName(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"pc-1", "pc1"},
		{"router-3", "router3"},
		{"web-server-20", "webserver20"},
		{"pc1", "pc1"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := SanitizeName(tt.input)

			if got != tt.want {
				t.Errorf(
					"SanitizeName(%q) = %q, want %q",
					tt.input,
					got,
					tt.want,
				)
			}
		})
	}
}

func TestIsRouter(t *testing.T) {
	tests := []struct {
		role string
		want bool
	}{
		{"pc", false},
		{"webserver", false},
		{"fileserver", false},
		{"bot", false},
		{"router", true},
		{"botrouter", true},
		{"unknown", false},
	}

	for _, tt := range tests {
		t.Run(tt.role, func(t *testing.T) {
			got := IsRouter(tt.role)

			if got != tt.want {
				t.Errorf(
					"IsRouter(%q) = %v, want %v",
					tt.role,
					got,
					tt.want,
				)
			}
		})
	}
}

func TestSortedNetworkIDs(t *testing.T) {
	input := map[string]string{
		"net3": "10.3.0.2",
		"net1": "10.1.0.2",
		"net2": "10.2.0.2",
	}

	got := SortedNetworkIDs(input)

	want := []string{
		"net1",
		"net2",
		"net3",
	}

	if !slices.Equal(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestConvertSimpleTopologyToCompose(t *testing.T) {
	data, err := os.ReadFile("testdata/simple-topology.json")
	if err != nil {
		t.Fatalf("failed to read topology: %v", err)
	}

	var topo Topology

	if err := json.Unmarshal(data, &topo); err != nil {
		t.Fatalf("failed to unmarshal topology: %v", err)
	}

	if err := CleanEnvironment(); err != nil {
		t.Fatalf("failed to clean environment: %v", err)
	}

	got, err := ConvertTopologyToCompose(topo)
	if err != nil {
		t.Fatalf(
			"ConvertTopologyToCompose returned unexpected error: %v",
			err,
		)
	}

	expected, err := os.ReadFile(
		"testdata/expected-simple-compose.yml",
	)
	if err != nil {
		t.Fatalf("failed to read expected compose file: %v", err)
	}

	if got != string(expected) {
		t.Errorf(
			"generated compose does not match expected output\n\nGot:\n%s\n\nExpected:\n%s",
			got,
			string(expected),
		)
	}
}

func loadTopology(t *testing.T, path string) Topology {
	t.Helper()

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read topology %s: %v", path, err)
	}

	var topo Topology

	if err := json.Unmarshal(data, &topo); err != nil {
		t.Fatalf("failed to unmarshal topology %s: %v", path, err)
	}

	return topo
}
