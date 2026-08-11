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
	CleanEnvironment()
	compose := ConvertTopologyToCompose(topo)
	fmt.Print(compose)
}
