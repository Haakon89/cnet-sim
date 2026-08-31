package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run . topology.json > docker-compose.yml")
		os.Exit(1)
	}

	data, err := os.ReadFile(os.Args[1])
	if err != nil {
		panic(err)
	}

	var topo Topology
	if err := json.Unmarshal(data, &topo); err != nil {
		panic(err)
	}
	if err := CleanEnvironment(); err != nil {
		fmt.Fprintln(os.Stderr, "failed to clean environment:", err)
		os.Exit(1)
	}
	compose, err := ConvertTopologyToCompose(topo)
	if err != nil {
		fmt.Fprintln(os.Stderr, "conversion failed:", err)
		os.Exit(1)
	}

	fmt.Print(compose)
}
