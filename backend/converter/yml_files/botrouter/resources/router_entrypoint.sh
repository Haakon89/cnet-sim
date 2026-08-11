#!/usr/bin/env bash
set -euo pipefail

DEVICE_NAME="${DEVICE_NAME:-router}"

echo "[$DEVICE_NAME] ip_forward=$(cat /proc/sys/net/ipv4/ip_forward)"
echo "[$DEVICE_NAME] interfaces:"
ip -br addr

apply_netem() {
  local dev="$1"
  if ip link show dev "$dev" >/dev/null 2>&1; then
    echo "[$DEVICE_NAME] applying netem on $dev"
    tc qdisc replace dev "$dev" root netem \
      delay "${DELAY_MEAN}" "${DELAY_JITTER}" \
      loss "${LOSS}" \
      rate "${RATE}"
    tc qdisc show dev "$dev" || true
  fi
}

add_routes() {
  local routes="${ROUTES:-}"
  [ -z "$routes" ] && return 0

  local OLDIFS="$IFS"
  local route

  IFS=';'
  for route in $routes; do
    route="$(echo "$route" | xargs)"
    [ -z "$route" ] && continue

    echo "[$DEVICE_NAME] adding route: $route"

    IFS="$OLDIFS"
    read -r -a route_parts <<< "$route"
    ip route replace "${route_parts[@]}"
    IFS=';'
  done

  IFS="$OLDIFS"
}

if [ -n "${DELAY_MEAN:-}" ] || [ -n "${LOSS:-}" ] || [ -n "${RATE:-}" ]; then
  apply_netem eth0
  apply_netem eth1
fi

add_routes
ip route del default || true

echo "[$DEVICE_NAME] routing table:"
ip route

iptables -P INPUT DROP
iptables -F
iptables -t nat -F
iptables -X
iptables -P FORWARD DROP
iptables -A FORWARD -i eth0 -o eth1 -j ACCEPT

echo "[$DEVICE_NAME] starting packet captures"
if ! /usr/local/bin/capture.sh "${CAPTURE_DURATION:-120}"; then
  echo "[$DEVICE_NAME] capture.sh exited with non-zero status, continuing idle anyway"
fi

echo "[$DEVICE_NAME] capture finished, idling"
tail -f /dev/null