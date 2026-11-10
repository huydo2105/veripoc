#!/usr/bin/env bash
set -euo pipefail

# Run only against the locally controlled source tree.
# Requires Foundry and slither-analyzer==0.11.6.
mkdir -p artifacts
echo "Slither version: $(slither --version)"
echo "Forge version: $(forge --version)"
forge build
# Crytic Compile skips test imports by default. These fixtures live outside src/
# and are reached through test/VaultFixture.t.sol, so include test compilation.
coverage=$(slither . --foundry-compile-all --print contract-summary 2>&1)
printf '%s\n' "$coverage"
for contract in VulnerableVault PatchedVault MockAsset; do
  if ! printf '%s\n' "$coverage" | grep -Fq "$contract"; then
    echo "ERROR: Slither compilation omitted $contract" >&2
    exit 1
  fi
done
status=0
slither . --foundry-compile-all --json artifacts/slither.json || status=$?
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
# Keep the machine-readable call graph alongside the detector report.
slither . --foundry-compile-all --print call-graph
test -s all_contracts.call-graph.dot
mv all_contracts.call-graph.dot artifacts/call-graph.dot
