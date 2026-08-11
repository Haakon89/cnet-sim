package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	composeFile := flag.String("compose", "docker-compose.yml", "Path to docker-compose.yml")
	duration := flag.Duration("duration", 60*time.Second, "How long the environment should run")
	outputDir := flag.String("output", "./results", "Where copied files should be stored")
	artifactPath := flag.String("path", "/output", "Path inside router containers to copy")
	interactive := flag.Bool("interactive", false, "Keep environment running until stopped")
	flag.Parse()

	projectName := "netsim_test"

	if err := EnsureDir(*outputDir); err != nil {
		panic(err)
	}

	fmt.Println("[+] Cleaning up old environment")
	_ = ComposeDown(projectName, *composeFile)

	fmt.Println("[+] Starting environment")
	if err := ComposeUp(projectName, *composeFile); err != nil {
		panic(err)
	}
	fmt.Println("[+] Environment running")
	defer func() {
		fmt.Println("[+] Stopping environment")
		_ = ComposeDown(projectName, *composeFile)
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	if *interactive {
		fmt.Println("[+] Interactive mode enabled")
		fmt.Println("[+] Waiting for stop signal")

		stop := make(chan os.Signal, 1)
		signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

		<-stop

		fmt.Println("[+] Stop signal received")
	} else {
		fmt.Printf("[+] Running for %s\n", duration.String())
		time.Sleep(*duration)
	}

	fmt.Println("[+] Stopping containers before collection")
	if err := ComposeStop(projectName, *composeFile); err != nil {
		panic(err)
	}

	fmt.Println("[+] Collecting router files")
	if err := CollectFromRouters(projectName, *composeFile, *artifactPath, *outputDir); err != nil {
		panic(err)
	}

	fmt.Println("[+] Removing environment")
	_ = ComposeDown(projectName, *composeFile)

	fmt.Println("[+] Done")
}
