package main

import (
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestComposeUp(t *testing.T) {
	original := runCommandFunc

	t.Cleanup(func() {
		runCommandFunc = original
	})

	var gotName string
	var gotArgs []string

	runCommandFunc = func(name string, args ...string) error {
		gotName = name
		gotArgs = args
		return nil
	}

	err := ComposeUp(
		"netsim_test",
		"/tmp/docker-compose.yml",
	)

	if err != nil {
		t.Fatalf("ComposeUp returned unexpected error: %v", err)
	}

	if gotName != "docker" {
		t.Errorf("command = %q, want %q", gotName, "docker")
	}

	wantArgs := []string{
		"compose",
		"-p", "netsim_test",
		"-f", "/tmp/docker-compose.yml",
		"up",
		"-d",
		"--build",
	}

	if !reflect.DeepEqual(gotArgs, wantArgs) {
		t.Errorf(
			"arguments = %v, want %v",
			gotArgs,
			wantArgs,
		)
	}
}

func TestComposeDown(t *testing.T) {
	original := runCommandFunc

	t.Cleanup(func() {
		runCommandFunc = original
	})

	var gotName string
	var gotArgs []string

	runCommandFunc = func(name string, args ...string) error {
		gotName = name
		gotArgs = args
		return nil
	}

	err := ComposeDown(
		"netsim_test",
		"docker-compose.yml",
	)

	if err != nil {
		t.Fatalf("ComposeDown returned unexpected error: %v", err)
	}

	if gotName != "docker" {
		t.Errorf("command = %q, want docker", gotName)
	}

	wantArgs := []string{
		"compose",
		"-p", "netsim_test",
		"-f", "docker-compose.yml",
		"down",
	}

	if !reflect.DeepEqual(gotArgs, wantArgs) {
		t.Errorf(
			"arguments = %v, want %v",
			gotArgs,
			wantArgs,
		)
	}
}

func TestComposeUpReturnsError(t *testing.T) {
	original := runCommandFunc

	t.Cleanup(func() {
		runCommandFunc = original
	})

	expectedErr := errors.New("docker failed")

	runCommandFunc = func(name string, args ...string) error {
		return expectedErr
	}

	err := ComposeUp(
		"netsim_test",
		"docker-compose.yml",
	)

	if !errors.Is(err, expectedErr) {
		t.Errorf(
			"ComposeUp error = %v, want %v",
			err,
			expectedErr,
		)
	}
}

func TestComposeContainerIDs(t *testing.T) {
	original := commandOutputFunc

	t.Cleanup(func() {
		commandOutputFunc = original
	})

	commandOutputFunc = func(
		name string,
		args ...string,
	) (string, error) {
		return `
abc123
def456
ghi789
`, nil
	}

	got, err := ComposeContainerIDs(
		"netsim_test",
		"docker-compose.yml",
	)

	if err != nil {
		t.Fatalf(
			"ComposeContainerIDs returned unexpected error: %v",
			err,
		)
	}

	want := []string{
		"abc123",
		"def456",
		"ghi789",
	}

	if !reflect.DeepEqual(got, want) {
		t.Errorf(
			"ComposeContainerIDs = %v, want %v",
			got,
			want,
		)
	}
}

func TestComposeContainerIDsEmpty(t *testing.T) {
	original := commandOutputFunc

	t.Cleanup(func() {
		commandOutputFunc = original
	})

	commandOutputFunc = func(
		name string,
		args ...string,
	) (string, error) {
		return "", nil
	}

	got, err := ComposeContainerIDs(
		"netsim_test",
		"docker-compose.yml",
	)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(got) != 0 {
		t.Errorf("expected no container IDs, got %v", got)
	}
}

func TestContainerName(t *testing.T) {
	original := commandOutputFunc

	t.Cleanup(func() {
		commandOutputFunc = original
	})

	commandOutputFunc = func(
		name string,
		args ...string,
	) (string, error) {
		return "/router3\n", nil
	}

	got, err := ContainerName("abc123")

	if err != nil {
		t.Fatalf(
			"ContainerName returned unexpected error: %v",
			err,
		)
	}

	if got != "router3" {
		t.Errorf(
			"ContainerName = %q, want %q",
			got,
			"router3",
		)
	}
}

func TestContainerNameReturnsError(t *testing.T) {
	original := commandOutputFunc

	t.Cleanup(func() {
		commandOutputFunc = original
	})

	expectedErr := errors.New("container not found")

	commandOutputFunc = func(
		name string,
		args ...string,
	) (string, error) {
		return "", expectedErr
	}

	_, err := ContainerName("invalid")

	if !errors.Is(err, expectedErr) {
		t.Errorf(
			"error = %v, want %v",
			err,
			expectedErr,
		)
	}
}

func TestIsRouterContainer(t *testing.T) {
	tests := []struct {
		name string
		want bool
	}{
		{"router1", true},
		{"router3", true},
		{"botrouter1", true},
		{"pc1", false},
		{"webserver1", false},
		{"fileserver1", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsRouterContainer(tt.name)

			if got != tt.want {
				t.Errorf(
					"IsRouterContainer(%q) = %v, want %v",
					tt.name,
					got,
					tt.want,
				)
			}
		})
	}
}

func TestEnsureDir(t *testing.T) {
	base := t.TempDir()

	target := filepath.Join(
		base,
		"one",
		"two",
		"three",
	)

	err := EnsureDir(target)
	if err != nil {
		t.Fatalf(
			"EnsureDir returned unexpected error: %v",
			err,
		)
	}

	info, err := os.Stat(target)
	if err != nil {
		t.Fatalf(
			"expected directory to exist: %v",
			err,
		)
	}

	if !info.IsDir() {
		t.Errorf("%s exists but is not a directory", target)
	}
}

func TestPrepareResultsDir(t *testing.T) {
	base := t.TempDir()

	results := filepath.Join(base, "results")

	if err := os.MkdirAll(results, 0755); err != nil {
		t.Fatal(err)
	}

	oldFile := filepath.Join(results, "old-result.txt")

	if err := os.WriteFile(
		oldFile,
		[]byte("old data"),
		0644,
	); err != nil {
		t.Fatal(err)
	}

	if err := PrepareResultsDir(results); err != nil {
		t.Fatalf(
			"PrepareResultsDir returned unexpected error: %v",
			err,
		)
	}

	if _, err := os.Stat(oldFile); !os.IsNotExist(err) {
		t.Errorf(
			"expected old file to be removed",
		)
	}

	info, err := os.Stat(results)
	if err != nil {
		t.Fatalf(
			"expected results directory to exist: %v",
			err,
		)
	}

	if !info.IsDir() {
		t.Errorf("results path is not a directory")
	}
}

func TestDockerCopy(t *testing.T) {
	original := combinedOutputFunc

	t.Cleanup(func() {
		combinedOutputFunc = original
	})

	var gotName string
	var gotArgs []string

	combinedOutputFunc = func(
		name string,
		args ...string,
	) (string, error) {
		gotName = name
		gotArgs = args
		return "", nil
	}

	err := DockerCopy(
		"abc123",
		"/output",
		"/tmp/results/router3",
	)

	if err != nil {
		t.Fatalf(
			"DockerCopy returned unexpected error: %v",
			err,
		)
	}

	wantArgs := []string{
		"cp",
		"abc123:/output/.",
		"/tmp/results/router3",
	}

	if gotName != "docker" {
		t.Errorf(
			"command = %q, want docker",
			gotName,
		)
	}

	if !reflect.DeepEqual(gotArgs, wantArgs) {
		t.Errorf(
			"arguments = %v, want %v",
			gotArgs,
			wantArgs,
		)
	}
}

func TestDockerCopyReturnsError(t *testing.T) {
	original := combinedOutputFunc

	t.Cleanup(func() {
		combinedOutputFunc = original
	})

	combinedOutputFunc = func(
		name string,
		args ...string,
	) (string, error) {
		return "No such container", errors.New("exit status 1")
	}

	err := DockerCopy(
		"bad-container",
		"/output",
		"/tmp/results",
	)

	if err == nil {
		t.Fatal("expected DockerCopy to return an error")
	}

	if !strings.Contains(err.Error(), "No such container") {
		t.Errorf(
			"error does not contain Docker output: %v",
			err,
		)
	}
}
