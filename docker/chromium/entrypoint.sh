#!/bin/sh
# Bind Chromium to the container's actual Docker-network IP so that:
# 1. The TCP socket is reachable from other containers in the same network.
# 2. The webSocketDebuggerUrl returned by /json/version uses that IP,
#    which Puppeteer can then connect to directly (it does NOT rewrite 0.0.0.0).
#
# Coolify's Docker network uses IPv6 for DNS resolution, so we prefer the
# IPv6 address from hostname -I. Falling back to IPv4 if no IPv6 is present.

# hostname -I returns space-separated IPs (IPv4 first, then IPv6)
CONTAINER_IPV6=$(hostname -I | tr ' ' '\n' | grep ':' | head -1)
CONTAINER_IPV4=$(hostname -I | awk '{print $1}')
CONTAINER_IP="${CONTAINER_IPV6:-$CONTAINER_IPV4}"

echo "Starting Chromium on [${CONTAINER_IP}]:9222 ..."

exec chromium \
  --headless=old \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-gpu \
  --remote-debugging-address="${CONTAINER_IP}" \
  --remote-debugging-port=9222 \
  --remote-allow-origins='*'
