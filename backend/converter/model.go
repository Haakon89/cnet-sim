package main

type Topology struct {
	Nodes    []Node    `json:"nodes"`
	Networks []Network `json:"networks"`
	Links    []Link    `json:"links"`
	Traffic  []Traffic `json:"trafficFlows"`
}

type Node struct {
	ID          string            `json:"id"`
	Role        string            `json:"role"`
	Networks    []string          `json:"networks"`
	IPAddresses map[string]string `json:"ipAddresses"`
	Position    Position          `json:"position"`
}

type BotNet struct {
	ID          string            `json:"id"`
	Role        string            `json:"role"`
	Size        int               `json:"size"`
	Networks    []string          `json:"networks"`
	IPAddresses map[string]string `json:"ipAddresses"`
	Position    Position          `json:"position"`
}

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Network struct {
	ID     string   `json:"id"`
	Subnet string   `json:"subnet"`
	Nodes  []string `json:"nodes"`
	Color  string   `json:"color"`
}

type Link struct {
	Source   string `json:"source"`
	Target   string `json:"target"`
	Network  string `json:"networkId"`
	Distance int    `json:"distance"`
}

type Traffic struct {
	ID            string `json:"id"`
	Source        string `json:"source"`
	SourceIP      string `json:"sourceIp"`
	Destination   string `json:"destination"`
	DestinationIP string `json:"destinationIp"`
	Type          string `json:"type"`
	Duration      int    `json:"duration"`
}
