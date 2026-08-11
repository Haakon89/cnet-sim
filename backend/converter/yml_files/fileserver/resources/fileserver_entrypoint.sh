#!/usr/bin/env bash
set -euo pipefail

DEVICE_NAME="${DEVICE_NAME:-fileserver}"
IFACE="${IFACE:-eth0}"
GW="${GW:?GW not set}"

SFTP_USER="user"
SFTP_PASSWORD="password"

mkdir -p /storage

if ! id "$SFTP_USER" >/dev/null 2>&1; then
  useradd -d /storage -s /bin/bash "$SFTP_USER"
fi

echo "$SFTP_USER:$SFTP_PASSWORD" | chpasswd
chown -R "$SFTP_USER:$SFTP_USER" /storage

mkdir -p /storage/.ssh
cat /tmp/fileserver_client_key.pub > /storage/.ssh/authorized_keys

chown -R "$SFTP_USER:$SFTP_USER" /storage/.ssh
chmod 700 /storage/.ssh
chmod 600 /storage/.ssh/authorized_keys

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

echo "[$DEVICE_NAME] preparing SFTP user: $SFTP_USER"

mkdir -p /var/run/sshd

echo "[$DEVICE_NAME] starting SSH/SFTP server..."
exec /usr/sbin/sshd -D