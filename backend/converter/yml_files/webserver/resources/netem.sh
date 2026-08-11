#!/usr/bin/env sh
set -eu

IFACE="${IFACE:-eth0}"
DELAY_MEAN="${DELAY_MEAN:-1ms}"
DELAY_JITTER="${DELAY_JITTER:-0.3ms}"
LOSS="${LOSS:-0.1%}"
RATE="${RATE:-50mbit}"

if [ -n "${GW:-}" ]; then
  echo "[netem] setting default gateway to $GW"
  ip route del default 2>/dev/null || true
  ip route add default via "$GW"
fi

echo "[netem] Applying netem on $IFACE"
echo "[netem] delay=$DELAY_MEAN ±$DELAY_JITTER loss=$LOSS rate=$RATE"

tc qdisc del dev "$IFACE" root 2>/dev/null || true
tc qdisc add dev "$IFACE" root netem \
  delay "$DELAY_MEAN" "$DELAY_JITTER" \
  loss "$LOSS" \
  rate "$RATE"

tc qdisc show dev "$IFACE" || true

echo "[netem] starting nginx"
exec nginx -g "daemon off;"