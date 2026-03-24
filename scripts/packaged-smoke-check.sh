#!/usr/bin/env bash
set -euo pipefail

APP_BINARY="${1:-./dist/mac-arm64/sysmonitor.app/Contents/MacOS/sysmonitor}"
LOG_FILE="${2:-/tmp/sysmonitor-packaged-smoke.log}"

if [ ! -x "$APP_BINARY" ]; then
  echo "Packaged app binary not found or not executable: $APP_BINARY" >&2
  exit 1
fi

"$APP_BINARY" > "$LOG_FILE" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
sleep 5

if kill -0 "$pid" 2>/dev/null; then
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  echo "Packaged app smoke check passed"
  exit 0
fi

cat "$LOG_FILE" >&2 || true
exit 1
