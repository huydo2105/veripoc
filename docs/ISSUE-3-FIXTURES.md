# Issue #3: local vault fixture evidence

Run `forge build` and `forge test -vvv` with solc 0.8.24 (`foundry.toml`). The Foundry fuzz seed is not needed for the deterministic reproduction; the scenario uses fixed values and no cheatcodes or random input. The separate honest round-trip fuzz test uses Foundry's default seed unless overridden by the runner.

1. Attacker starts with 101 asset units and deposits 1 share unit into an empty vault.
2. Attacker donates 100 asset units directly to the vault.
3. Victim starts with 100 and deposits all 100.
4. Attacker redeems their complete share balance.

The vulnerable vault rounds the victim's deposit to zero shares; the attacker ends with 201 assets and the victim with zero. The patched vault uses one virtual asset and 1,000,000 virtual shares. In the same sequence, the victim receives shares and the attacker cannot end above the initial 101 assets. The test independently checks token balances, shares, and vault assets. This demonstrates one controlled rounding attack and its mitigation; it does not prove general security, full ERC-4626 compliance, or safe deployment.

Local verification on 2026-11-10: `forge build` compiled with solc 0.8.24 and `forge test -vvv` passed 6 tests (including the existing Counter tests and 256 fuzz runs for the round trip). Local Forge was 1.7.1; CI uses 1.9.0. `bash scripts/run-slither.sh` was attempted but could not complete because `slither` is not installed in this shell. Inspect the PR's pinned Slither CI job before marking Issue #3 complete.

Slither coverage correction: the project-level analyzer skips test imports by default, while these fixtures are imported only by `test/VaultFixture.t.sol`. The analyzer script now requests complete Foundry compilation and fails unless its contract summary contains `VulnerableVault`, `PatchedVault`, and `MockAsset`. A green CI job before this correction did not establish coverage of those contracts.

These contracts and the freely mintable asset must never be used with real funds. No external targets or fork RPC are involved.
