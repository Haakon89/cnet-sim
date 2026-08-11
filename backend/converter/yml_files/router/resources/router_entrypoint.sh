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
  for iface in $(ip -o link show | awk -F': ' '{print $2}' | cut -d '@' -f 1 | grep -v '^lo$'); do
    apply_netem "$iface"
  done
fi

add_routes
ip route del default || true

echo "[$DEVICE_NAME] routing table:"
ip route

# Flush old rules
iptables -F
iptables -t nat -F
iptables -X

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow already established traffic
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow ping to the firewall itself
iptables -A INPUT -p icmp -j ACCEPT

# Allow forwarding between all non-loopback interfaces
interfaces=$(ip -o link show | awk -F': ' '{print $2}' | cut -d '@' -f 1 | grep -E '^eth[0-9]+$' || true)

for in_if in $interfaces; do
  for out_if in $interfaces; do
    if [ "$in_if" != "$out_if" ]; then
      echo "[$DEVICE_NAME] allowing forward: $in_if -> $out_if"
      iptables -A FORWARD -i "$in_if" -o "$out_if" -j ACCEPT
    fi
  done
done

DELAY_SCRIPT="${DELAY_SCRIPT:-}"

if [ -n "$DELAY_SCRIPT" ]; then
  echo "[$DEVICE_NAME] running delay: $DELAY_SCRIPT"

  if [ -x "$DELAY_SCRIPT" ]; then
    "$DELAY_SCRIPT" &
  else
    echo "[$DEVICE_NAME] delay script not executable or not found: $DELAY_SCRIPT"
  fi
else
  echo "[$DEVICE_NAME] no delay configured, idling"
fi

echo "[$DEVICE_NAME] starting packet captures"
if ! /usr/local/bin/capture.sh "${CAPTURE_DURATION:-120}"; then
  echo "[$DEVICE_NAME] capture.sh exited with non-zero status, continuing idle anyway"
fi

echo "[$DEVICE_NAME] capture finished, idling"
tail -f /dev/null