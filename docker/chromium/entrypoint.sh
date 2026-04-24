#!/bin/sh
# Bind Chromium to the container's actual Docker-network IP so that:
# 1. The TCP socket is reachable from other containers in the same network.
# 2. The webSocketDebuggerUrl returned by /json/version uses that IP,
#    which Puppeteer can then connect to directly (it does NOT rewrite 0.0.0.0).
#
# Using 0.0.0.0 here would make Chromium listen on all interfaces but return
# "ws://0.0.0.0:9222/..." in the JSON, which is not a valid connection target
# from another container.

CONTAINER_IP=$(hostname -I | awk '{print $1}')

echo "Starting Chromium on ${CONTAINER_IP}:9222 ..."

exec chromium \
  --headless=old \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-gpu \
  --remote-debugging-address="${CONTAINER_IP}" \
  --remote-debugging-port=9222 \
  --remote-allow-origins='*'
