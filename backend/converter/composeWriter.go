package main

import (
	"fmt"
	"slices"
	"sort"
	"strings"
)

func ConvertTopologyToCompose(topo Topology) string {
	result := ConvertTopology(topo)
	return RenderCompose(topo, result)
}

func RenderCompose(topo Topology, result ConversionResult) string {
	var b strings.Builder

	writeHeader(&b, topo)
	writeServices(&b, topo, result)
	writeNetworks(&b, topo)

	return b.String()
}

func writeHeader(b *strings.Builder, topo Topology) {
	alreadyUsedTemplates := []string{}
	for _, node := range topo.Nodes {
		nodeName := SanitizeName(node.ID)
		nodeRole := node.Role
		generateScriptFiles(nodeName, nodeRole)
		if !slices.Contains(alreadyUsedTemplates, nodeRole) {
			alreadyUsedTemplates = append(alreadyUsedTemplates, nodeRole)
			writeTemplate(b, nodeRole)
		}

	}
	b.WriteString(`x-netem-env: &netem_env
  DELAY_MEAN: 1ms
  DELAY_JITTER: 0.3ms
  LOSS: 0.1%
  RATE: 50mbit

services:
`)
}

func writeServices(b *strings.Builder, topo Topology, result ConversionResult) {
	for _, node := range topo.Nodes {
		if IsRouter(node.Role) {
			writeRouterService(b, node, topo, result)
		} else {
			writeDeviceService(b, topo, node, result)
		}

		b.WriteString("\n")
	}
}

func writeRouterService(b *strings.Builder, node Node, topo Topology, result ConversionResult) {
	serviceName := SanitizeName(node.ID)
	duration := 300
	b.WriteString(fmt.Sprintf("  %s:\n", serviceName))
	b.WriteString(fmt.Sprintf("    <<: *%s_template\n", node.Role))
	b.WriteString(fmt.Sprintf("    container_name: %s\n", serviceName))
	b.WriteString("    environment:\n")
	b.WriteString("      <<: *netem_env\n")
	b.WriteString(fmt.Sprintf("      DEVICE_NAME: %s\n", serviceName))
	b.WriteString(fmt.Sprintf("      CAPTURE_DURATION: %d\n", duration))
	routes := result.RoutesByRouter[node.ID]
	if len(routes) > 0 {
		b.WriteString(fmt.Sprintf("      ROUTES: %q\n", strings.Join(routes, ";")))
	}
	writeVolumes(b, serviceName, node.Role)
	ethNumber := 0
	seenNetworks := make(map[string]bool)

	for _, net := range node.Networks {
		if seenNetworks[net] {
			continue
		}

		for _, link := range topo.Links {
			if link.Network == net {
				if err := generateDelay(serviceName, link.Distance, ethNumber); err != nil {
					return
				}
				ethNumber++
				seenNetworks[net] = true
				break
			}
		}
	}

	writeServiceNetworks(b, node.ID, result)
}

func writeDeviceService(
	b *strings.Builder,
	topo Topology,
	node Node,
	result ConversionResult,
) {
	serviceName := SanitizeName(node.ID)
	nodeRole := node.Role
	nodeID := node.ID
	b.WriteString(fmt.Sprintf("  %s:\n", serviceName))
	b.WriteString(fmt.Sprintf("    <<: *%s_template\n", nodeRole))
	b.WriteString(fmt.Sprintf("    container_name: %s\n", serviceName))
	b.WriteString("    environment:\n")
	b.WriteString("      <<: *netem_env\n")
	b.WriteString(fmt.Sprintf("      DEVICE_NAME: %s\n", serviceName))
	b.WriteString("      IFACE: eth0\n")

	gw := FindGateway(nodeID, topo, result.NodeByID, result.IPByNodeNet)
	if gw != "" {
		b.WriteString(fmt.Sprintf("      GW: %s\n", gw))
	}
	writeVolumes(b, serviceName, nodeRole)
	for _, traffic := range topo.Traffic {
		if traffic.Source == nodeID {
			sourceName := SanitizeName((traffic.Source))
			destinationName := SanitizeName(traffic.Destination)
			generateTraffic(sourceName, destinationName, traffic.DestinationIP, traffic.Type, traffic.Duration)
		}
	}

	writeServiceNetworks(b, node.ID, result)
}

func writeServiceNetworks(
	b *strings.Builder,
	nodeID string,
	result ConversionResult,
) {
	b.WriteString("    networks:\n")

	networkIDs := SortedNetworkIDs(result.IPByNodeNet[nodeID])

	for _, networkID := range networkIDs {
		ip := result.IPByNodeNet[nodeID][networkID]

		b.WriteString(fmt.Sprintf("      %s:\n", networkID))
		b.WriteString(fmt.Sprintf("        ipv4_address: %s\n", ip))
	}
}

func writeNetworks(b *strings.Builder, topo Topology) {
	b.WriteString("networks:\n")

	for _, network := range topo.Networks {
		b.WriteString(fmt.Sprintf("  %s:\n", network.ID))
		b.WriteString("    driver: bridge\n")
		b.WriteString("    ipam:\n")
		b.WriteString("      config:\n")
		b.WriteString(fmt.Sprintf("        - subnet: %s\n", network.Subnet))
	}
}

func SortedNetworkIDs(m map[string]string) []string {
	keys := []string{}

	for key := range m {
		keys = append(keys, key)
	}

	sort.Strings(keys)
	return keys
}

func SanitizeName(name string) string {
	return strings.ReplaceAll(name, "-", "")
}
