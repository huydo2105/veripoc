#!/usr/bin/env bash
set -euo pipefail

# Run only against the locally controlled source tree.
# Requires Foundry and slither-analyzer==0.11.6.
mkdir -p artifacts
echo "Slither version: $(slither --version)"
echo "Forge version: $(forge --version)"
forge build
status=0
slither . --json artifacts/slither.json || status=$?
python3 - <<'PY'
import json
from pathlib import Path
p = Path("artifacts/slither.json")
if not p.is_file():
    raise SystemExit("ERROR: Slither failed without a JSON report")
report = json.loads(p.read_text(encoding="utf-8"))
if not report.get("success", False):
    raise SystemExit("ERROR: Slither did not finish successfully: " + str(report.get("error")))
detectors = (report.get("results") or {}).get("detectors") or []
print(f"Slither completed with {len(detectors)} detector finding(s); report: {p}")
PY
echo "Slither process status: $status (nonzero may mean findings; JSON success is checked)"
