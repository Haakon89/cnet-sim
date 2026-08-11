package main

import (
	"fmt"
	"os"
	"strings"
)

func generateScriptFiles(deviceName string, deviceRole string) {
	if IsRouter(deviceRole) {
		generateDistanceDelayScript(deviceName)
	} else {
		generateStartupScript(deviceName)
		generateWorkloadScript(deviceName)
	}
}

func writeVolumes(b *strings.Builder, deviceName string, deviceRole string) {
	if IsRouter(deviceRole) {
		b.WriteString("      DELAY_SCRIPT: /usr/local/bin/delay.sh\n")

		b.WriteString(fmt.Sprintf(
			`    volumes:
      - ./traffic_scripts/%[1]s_delay.sh:/usr/local/bin/delay.sh:ro
`, deviceName))
	} else {
		b.WriteString("      STARTUP_SCRIPT: /usr/local/bin/startup.sh\n")
		b.WriteString("      WORKLOAD_SCRIPT: /usr/local/bin/workload.sh\n")

		b.WriteString(fmt.Sprintf(
			`    volumes:
      - ./traffic_scripts/%[1]s_startup.sh:/usr/local/bin/startup.sh:ro
      - ./traffic_scripts/%[1]s_workload.sh:/usr/local/bin/workload.sh:ro
`, deviceName))
	}
}
func generateWorkloadScript(deviceName string) error {
	var b strings.Builder
	b.WriteString("#!/usr/bin/env bash\n")
	b.WriteString("set -euo pipefail\n\n")
	startupFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", deviceName)

	return os.WriteFile(startupFileName, []byte(b.String()), 0755)
}

func generateStartupScript(deviceName string) error {
	var b strings.Builder

	b.WriteString("#!/usr/bin/env bash\n")
	b.WriteString("set -euo pipefail\n\n")

	startupFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_startup.sh", deviceName)

	return os.WriteFile(startupFileName, []byte(b.String()), 0755)
}

func generateDistanceDelayScript(deviceName string) error {
	var b strings.Builder
	b.WriteString("#!/usr/bin/env bash\n")
	b.WriteString("set -euo pipefail\n\n")
	startupFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_delay.sh", deviceName)

	return os.WriteFile(startupFileName, []byte(b.String()), 0755)
}
