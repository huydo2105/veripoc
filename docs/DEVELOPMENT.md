# VeriPoC developer setup (Issue #2)

This branch creates a minimal **reproducible Foundry + Slither baseline**, not a working exploit scanner, backend API, or sandbox.

## Requirements
- **Linux, WSL2 Ubuntu, or macOS**. On Windows, use WSL2 for the Foundry/Slither workflow.
- Foundry (`forge`, `anvil`, `cast`): https://book.getfoundry.sh/getting-started/installation
- Python 3.10+ and pip or uv
- Solidity compiler **0.8.24** selected through `foundry.toml`; Foundry downloads compiler on first build.
- Slither **0.11.6**: `python3 -m pip install slither-analyzer==0.11.6` (prefer a virtual environment).

## Quick start
```bash
git clone https://github.com/huydo2105/veripoc.git
cd veripoc
forge --version
forge build
forge test -vvv
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install slither-analyzer==0.11.6
bash scripts/run-slither.sh
```

No blockchain RPC URL, private key, wallet, or funding is needed for this baseline. No deployed target contract is touched.

## Expected artifacts
- `forge build` generates `out/` and `cache/`.
- `forge test` runs smoke and fuzz tests against `Counter.sol`.
- `bash scripts/run-slither.sh` generates `artifacts/slither.json` and reports findings.
- GitHub Actions executes both jobs on PRs and `main`; check the actual CI result before closing Issue #2.

## Pinning / limitations
- Compiler is pinned to solc **0.8.24**.
- Slither is pinned to **0.11.6**.
- CI uses Foundry **v1.9.0** via foundry-toolchain; local setup should install the same version and check `forge --version`.
- GitHub Actions major-version tags are not SHA-pinned; harden after the baseline is validated.
- Avoid running code from untrusted repositories in this development environment. A future worker must use stronger execution isolation and fixed trusted verification oracles.

Run the combined orchestrator using `node scripts/baseline.mjs` after installing the listed tools.

A fully version-pinned development container is not yet shipped; for now prefer WSL2 or CI. A future sandbox container must not be confused with this trusted developer setup.

## Next task
Issue #3: Add intentionally vulnerable and patched ERC-4626 targets with independent invariant tests. This Counter fixture does not claim to reveal a vulnerability.
