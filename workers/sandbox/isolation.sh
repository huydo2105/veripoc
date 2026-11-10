#!/usr/bin/env bash
set -euo pipefail

# Probe the same core containment settings as the Node runner on a disposable image.
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --pids-limit 64 --memory 512m --cpus 1 \
  --user 10001:10001 --entrypoint sh veripoc-foundry-worker:issue-5 \
  -c 'test "$(id -u)" = 10001 && test ! -e /var/run/docker.sock && test ! -e /sys/class/net/eth0 && ! touch /workspace/write-probe'
