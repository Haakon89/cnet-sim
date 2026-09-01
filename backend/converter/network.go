package main

import (
	"fmt"
	"sort"
)

type ConversionResult struct {
	NodeByID       map[string]Node
	IPByNodeNet    map[string]map[string]string
	RoutesByRouter map[string][]string
}

func ConvertTopology(topo Topology) (ConversionResult, error) {
	nodeByID := map[string]Node{}

	for _, node := range topo.Nodes {
		nodeByID[node.ID] = node
	}

	ipByNodeNet, err := AssignIPs(topo, nodeByID)
	if err != nil {
		return ConversionResult{}, fmt.Errorf(
			"failed to assign IP addresses: %w",
			err,
		)
	}

	routesByRouter := BuildRoutes(topo, nodeByID, ipByNodeNet)

	return ConversionResult{
		NodeByID:       nodeByID,
		IPByNodeNet:    ipByNodeNet,
		RoutesByRouter: routesByRouter,
	}, nil
}

func generateDelay(sourceName string, distance int, netInterface int) error {
	delay := calculateDelay(distance)
	jitter := calculateJitter(delay)

	content := fmt.Sprintf(`
tc qdisc add dev eth%d root netem delay %.2fms %.2fms

`, netInterface, delay, jitter)
	sourceFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_delay.sh", sourceName)

	return appendToFile(sourceFileName, content)
}

func calculateJitter(delay float64) float64 {
	jitter := delay * 0.10
	if jitter < 0.01 {
		jitter = 0.01
	}
	return jitter
}

func calculateDelay(distance int) float64 {
	const propagationSpeed = 200_000_000.0
	return (float64(distance) / propagationSpeed) * 1000
}

func AssignIPs(
	topo Topology,
	nodeByID map[string]Node,
) (map[string]map[string]string, error) {
	result := map[string]map[string]string{}

	for _, network := range topo.Networks {
		for _, nodeID := range network.Nodes {
			node, ok := nodeByID[nodeID]
			if !ok {
				return nil, fmt.Errorf(
					"node %q referenced by network %q was not found",
					nodeID,
					network.ID,
				)
			}

			ip, ok := node.IPAddresses[network.ID]
			if !ok || ip == "" {
				return nil, fmt.Errorf(
					"missing IP for node %q on network %q",
					nodeID,
					network.ID,
				)
			}

			if result[nodeID] == nil {
				result[nodeID] = map[string]string{}
			}

			result[nodeID][network.ID] = ip
		}
	}

	return result, nil
}
func BuildRoutes(
	topo Topology,
	nodeByID map[string]Node,
	ipByNodeNet map[string]map[string]string,
) map[string][]string {
	routes := map[string][]string{}

	routerIDs := GetRouterIDs(topo)

	for _, routerID := range routerIDs {
		for _, targetNetwork := range topo.Networks {
			if _, directlyConnected := ipByNodeNet[routerID][targetNetwork.ID]; directlyConnected {
				continue
			}

			nextHopRouter, sharedNetwork := FindNextHopRouter(routerID, targetNetwork.ID, routerIDs, ipByNodeNet)
			if nextHopRouter == "" {
				continue
			}

			nextHopIP := ipByNodeNet[nextHopRouter][sharedNetwork]

			routes[routerID] = append(routes[routerID],
				fmt.Sprintf("%s via %s", targetNetwork.Subnet, nextHopIP),
			)
		}

		sort.Strings(routes[routerID])
	}

	return routes
}

func GetRouterIDs(topo Topology) []string {
	var routers []string

	for _, node := range topo.Nodes {
		if IsRouter(node.Role) {
			routers = append(routers, node.ID)
		}
	}

	return routers
}

func FindNextHopRouter(
	startRouter string,
	targetNetwork string,
	routerIDs []string,
	ipByNodeNet map[string]map[string]string,
) (string, string) {
	type PathState struct {
		Router string
		Path   []string
	}

	queue := []PathState{
		{
			Router: startRouter,
			Path:   []string{startRouter},
		},
	}

	visited := map[string]bool{
		startRouter: true,
	}

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		if _, reachesTarget := ipByNodeNet[current.Router][targetNetwork]; reachesTarget {
			if len(current.Path) < 2 {
				return "", ""
			}

			nextHopRouter := current.Path[1]
			sharedNetwork := FirstSharedNetwork(startRouter, nextHopRouter, ipByNodeNet)

			return nextHopRouter, sharedNetwork
		}

		for _, otherRouter := range routerIDs {
			if visited[otherRouter] || otherRouter == current.Router {
				continue
			}

			sharedNetwork := FirstSharedNetwork(current.Router, otherRouter, ipByNodeNet)
			if sharedNetwork == "" {
				continue
			}

			visited[otherRouter] = true

			newPath := append([]string{}, current.Path...)
			newPath = append(newPath, otherRouter)

			queue = append(queue, PathState{
				Router: otherRouter,
				Path:   newPath,
			})
		}
	}

	return "", ""
}

func FirstSharedNetwork(
	a string,
	b string,
	ipByNodeNet map[string]map[string]string,
) string {
	networkIDs := make([]string, 0, len(ipByNodeNet[a]))

	for networkID := range ipByNodeNet[a] {
		networkIDs = append(networkIDs, networkID)
	}

	sort.Strings(networkIDs)

	for _, networkID := range networkIDs {
		if _, ok := ipByNodeNet[b][networkID]; ok {
			return networkID
		}
	}

	return ""
}

func FindGateway(
	nodeID string,
	topo Topology,
	nodeByID map[string]Node,
	ipByNodeNet map[string]map[string]string,
) string {
	for networkID := range ipByNodeNet[nodeID] {
		for _, network := range topo.Networks {
			if network.ID != networkID {
				continue
			}

			for _, memberID := range network.Nodes {
				member := nodeByID[memberID]

				if IsRouter(member.Role) {
					return ipByNodeNet[memberID][networkID]
				}
			}
		}
	}

	return ""
}
