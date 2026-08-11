#!/usr/bin/env bash
set -euo pipefail

DEVICE_NAME="${DEVICE_NAME:-device}"
IFACE="${IFACE:-eth0}"
GW="${GW:?GW not set}"
STARTUP_SCRIPT="${STARTUP_SCRIPT:-}"
WORKLOAD_SCRIPT="${WORKLOAD_SCRIPT:-}"

echo "[$DEVICE_NAME] waiting for $IFACE..."
for _ in $(seq 1 50); do
  ip link show dev "$IFACE" >/dev/null 2>&1 && break
  sleep 0.1
done

echo "[$DEVICE_NAME] setting default route via $GW dev $IFACE"
ip route replace default via "$GW" dev "$IFACE"

if [ -x /usr/local/bin/netem.sh ]; then
  /usr/local/bin/netem.sh
fi

if [ -n "$STARTUP_SCRIPT" ]; then
  echo "[$DEVICE_NAME] running startup: $STARTUP_SCRIPT"

  if [ -x "$STARTUP_SCRIPT" ]; then
    "$STARTUP_SCRIPT" &
  else
    echo "[$DEVICE_NAME] startup script not executable or not found: $STARTUP_SCRIPT"
  fi
else
  echo "[$DEVICE_NAME] no startup configured, idling"
fi

if [ -n "$WORKLOAD_SCRIPT" ]; then
  echo "[$DEVICE_NAME] running workload: $WORKLOAD_SCRIPT"

  if [ -x "$WORKLOAD_SCRIPT" ]; then
    "$WORKLOAD_SCRIPT" &
  else
    echo "[$DEVICE_NAME] workload script not executable or not found: $WORKLOAD_SCRIPT"
  fi
else
  echo "[$DEVICE_NAME] no workload configured, idling"
fi

tail -f /dev/null