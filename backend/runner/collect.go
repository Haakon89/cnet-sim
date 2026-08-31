package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func CollectFromRouters(
	projectName string,
	composeFile string,
	artifactPath string,
	outputDir string,
) error {
	containerIDs, err := ComposeContainerIDs(projectName, composeFile)
	if err != nil {
		return err
	}

	runDir := filepath.Join(outputDir, projectName)

	if err := PrepareResultsDir(runDir); err != nil {
		return fmt.Errorf("failed to prepare results directory: %w", err)
	}

	for _, containerID := range containerIDs {
		name, err := ContainerName(containerID)
		if err != nil {
			return err
		}

		if !IsRouterContainer(name) {
			continue
		}

		targetDir := filepath.Join(runDir, name)

		if err := EnsureDir(targetDir); err != nil {
			return err
		}

		fmt.Printf("[+] Copying %s:%s\n", name, artifactPath)

		err = DockerCopy(containerID, artifactPath, targetDir)
		if err != nil {
			fmt.Printf("[!] Could not copy from %s: %v\n", name, err)
		}
	}

	return nil
}

func ContainerName(containerID string) (string, error) {
	output, err := commandOutputFunc(
		"docker",
		"inspect",
		"--format",
		"{{.Name}}",
		containerID,
	)
	if err != nil {
		return "", err
	}

	name := strings.TrimSpace(output)
	name = strings.TrimPrefix(name, "/")

	return name, nil
}

func IsRouterContainer(name string) bool {
	return strings.Contains(name, "router")
}

func PrepareResultsDir(outputDir string) error {
	abs, err := filepath.Abs(outputDir)
	if err != nil {
		return err
	}

	fmt.Println("[+] Cleaning results directory:", abs)

	if err := os.RemoveAll(abs); err != nil {
		return err
	}

	return os.MkdirAll(abs, 0755)
}

func DockerCopy(
	containerID string,
	sourcePath string,
	targetDir string,
) error {
	source := fmt.Sprintf("%s:%s/.", containerID, sourcePath)

	output, err := combinedOutputFunc(
		"docker",
		"cp",
		source,
		targetDir,
	)
	if err != nil {
		return fmt.Errorf(
			"docker cp failed: %w\n%s",
			err,
			output,
		)
	}

	return nil
}
