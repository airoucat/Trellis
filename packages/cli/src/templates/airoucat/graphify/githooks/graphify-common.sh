#!/usr/bin/env sh
set -eu

if [ "${TRELLIS_GRAPHIFY_DISABLE:-0}" = "1" ]; then
  exit 0
fi

if [ -x "scripts/dev/setup_graphify_local.py" ]; then
  python3 scripts/dev/setup_graphify_local.py --rebuild --reason "git-hook:${1:-unknown}"
else
  python3 scripts/dev/setup_graphify_local.py --rebuild --reason "git-hook:${1:-unknown}"
fi
