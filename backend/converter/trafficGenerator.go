package main

import (
	"fmt"
	"os"
)

func generateTraffic(sourceName string, destinationName string, destinationIp string, trafficType string, duration int) {
	switch trafficType {
	case "icmp":
		pingTraffic(sourceName, destinationIp, duration)
	case "http":
		httpTraffic(sourceName, destinationIp, duration)
	case "tcp":
		tcpTraffic(sourceName, destinationName, destinationIp, duration)
	case "udp":
		udpTraffic(sourceName, destinationName, destinationIp, duration)
	case "iperf3":
		bandwidthTest(sourceName, destinationName, destinationIp, duration)
	case "download":
		downloadFile(sourceName, destinationIp)
	case "ddos":
		ddosAttack(sourceName, destinationIp, duration)
	}
}

func pingTraffic(sourceName string, destinationIP string, duration int) error {
	content := fmt.Sprintf(`
for ((i=1; i<=%d; i++)); do
	sleep 1
	ping -c 1 %s
done

`, duration, destinationIP)

	fileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)

	return appendToFile(fileName, content)
}

func httpTraffic(sourceName string, destinationIP string, duration int) error {
	content := fmt.Sprintf(`
for ((i=1; i<=%d; i++)); do
	sleep 1
	curl %s
done

`, duration, destinationIP)

	fileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)

	return appendToFile(fileName, content)
}

func tcpTraffic(sourceName string, destinationName string, destinationIP string, duration int) error {
	sourceContent := fmt.Sprintf(`
sleep 1
echo "This is TCP traffic" | nc %s 5000 || true
sleep %d

`, destinationIP, duration)

	destinationContent := fmt.Sprintf(`
timeout %d sh -c 'while true; do nc -l -p 5000; done' || true

`, duration)

	sourceFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)
	destinationFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_startup.sh", destinationName)

	if err := appendToFile(destinationFileName, destinationContent); err != nil {
		return err
	}

	return appendToFile(sourceFileName, sourceContent)
}

func udpTraffic(sourceName string, destinationName string, destinationIP string, duration int) error {
	sourceContent := fmt.Sprintf(`
sleep 1
echo "This is UDP traffic" | nc -u %s 5001 || true
sleep %d

`, destinationIP, duration)

	destinationContent := fmt.Sprintf(`
timeout %d sh -c 'while true; do nc -u -l 5001; done' || true

`, duration)

	sourceFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)
	destinationFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_startup.sh", destinationName)

	if err := appendToFile(destinationFileName, destinationContent); err != nil {
		return err
	}

	return appendToFile(sourceFileName, sourceContent)
}

func bandwidthTest(sourceName string, destinationName string, destinationIP string, duration int) error {
	sourceContent := fmt.Sprintf(`
sleep 1
iperf3 -c %s -P 5 -t %d

`, destinationIP, duration)

	destinationContent := fmt.Sprintf(`
timeout %d iperf3 -s || true

`, duration)

	sourceFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)
	destinationFileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_startup.sh", destinationName)

	if err := appendToFile(destinationFileName, destinationContent); err != nil {
		return err
	}

	return appendToFile(sourceFileName, sourceContent)
}

func downloadFile(sourceName string, destinationIp string) error {
	content := fmt.Sprintf(`
sftp -i /root/.ssh/fileserver_client_key \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  user@%s <<EOF
get welcome.txt
get logo.png
get report.pdf
bye
EOF
`, destinationIp)

	fileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)

	return appendToFile(fileName, content)
}

func uploadFile(sourceName string, destinationIp string) error {
	content := fmt.Sprintf(`
sftp -i /root/.ssh/fileserver_client_key \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  user@%s <<EOF
put /tmp/files/note.txt
put /tmp/files/logo2.png
put /tmp/files/report2.pdf
bye
EOF
`, destinationIp)

	fileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)

	return appendToFile(fileName, content)
}

func ddosAttack(sourceName string, destinationIp string, duration int) error {
	content := fmt.Sprintf(`
for ((i=1; i<=%d; i++)); do
	curl --connect-timeout 1 --max-time 1 %s
done

`, duration, destinationIp)

	fileName := fmt.Sprintf("./yml_files/traffic_scripts/%s_workload.sh", sourceName)

	return appendToFile(fileName, content)
}

func appendToFile(fileName string, content string) error {
	file, err := os.OpenFile(
		fileName,
		os.O_APPEND|os.O_CREATE|os.O_WRONLY,
		0755,
	)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.WriteString(content)
	return err
}
