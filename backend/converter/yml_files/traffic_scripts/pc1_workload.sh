#!/usr/bin/env bash
set -euo pipefail


sleep 1
echo "This is TCP traffic" | nc 10.2.0.10 5000 || true
sleep 60

