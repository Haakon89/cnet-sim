#!/usr/bin/env bash
set -euo pipefail


tc qdisc add dev eth0 root netem delay 0.00ms 0.01ms


tc qdisc add dev eth1 root netem delay 0.00ms 0.01ms

