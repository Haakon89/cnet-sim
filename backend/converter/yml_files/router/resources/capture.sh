#!/usr/bin/env bash
set -euo pipefail

DURATION=${1:-120}

CAP_DIR=/output
mkdir -p "$CAP_DIR"

pids=()

while read -r iface; do
    echo "[+] Starting capture on $iface"

    timeout "$DURATION" tcpdump \
      -i "$iface" \
      -nn \
      -e \
      -s 0 \
      -U \
      -w "$CAP_DIR/${iface}.pcapng" &

    pids+=("$!")

done < <(
    ip -o link show \
    | awk -F': ' '{print $2}' \
    | cut -d '@' -f 1 \
    | grep -v '^lo$'
)

for pid in "${pids[@]}"; do
    wait "$pid" || true
done

echo "[+] Captures finished"