package main

import (
	"bytes"
	"os/exec"
	"strings"
)

func ComposeUp(projectName string, composeFile string) error {
	return runCommand(
		"docker",
		"compose",
		"-p", projectName,
		"-f", composeFile,
		"up",
		"-d",
		"--build",
	)
}

func ComposeDown(projectName string, composeFile string) error {
	return runCommand(
		"docker",
		"compose",
		"-p", projectName,
		"-f", composeFile,
		"down",
	)
}

func ComposeStop(projectName string, composeFile string) error {
	return runCommand(
		"docker",
		"compose",
		"-p", projectName,
		"-f", composeFile,
		"stop",
	)
}

func ComposeContainerIDs(projectName string, composeFile string) ([]string, error) {
	output, err := commandOutput(
		"docker",
		"compose",
		"-p", projectName,
		"-f", composeFile,
		"ps",
		"-a",
		"-q",
	)
	if err != nil {
		return nil, err
	}

	lines := strings.Split(strings.TrimSpace(output), "\n")

	var ids []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			ids = append(ids, line)
		}
	}

	return ids, nil
}

func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = nil
	cmd.Stderr = nil
	return cmd.Run()
}

func commandOutput(name string, args ...string) (string, error) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	cmd := exec.Command(name, args...)
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", err
	}

	return stdout.String(), nil
}
