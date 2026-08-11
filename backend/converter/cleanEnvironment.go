package main

import (
	"fmt"
	"os"
	"path/filepath"
)

const scriptDir = "./yml_files/traffic_scripts"

func CleanEnvironment() error {
	abs, err := filepath.Abs(scriptDir)
	if err != nil {
		return err
	}

	if abs == "/" {
		return fmt.Errorf("refusing to remove root directory")
	}

	if err := os.RemoveAll(abs); err != nil {
		return err
	}

	return os.MkdirAll(abs, 0755)
}
