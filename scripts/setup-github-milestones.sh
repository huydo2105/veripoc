#!/usr/bin/env bash
set -euo pipefail

# Backward-compatible milestone-only shortcut.
# The complete project and milestone sync is now scripts/sync-github-planning.py.
cd "$(dirname "$0")/.."
python3 scripts/sync-github-planning.py --milestones-only "$@"
