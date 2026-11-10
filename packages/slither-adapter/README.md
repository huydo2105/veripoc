# Slither adapter (Issue #4)

Run `npm test` for parser tests. In the documented Linux/WSL environment with Foundry and Slither 0.11.6 installed, run `npm run scan:fixture`. It scans only the checked-in authorized repository, writes raw JSON and DOT artifacts under `artifacts/`, then writes `artifacts/normalized-slither.json`.

`status: analyzed` means Slither completed and its report passed schema checks. It does not mean the contract is safe. Each finding has a stable ID based on source hash, rule, and primary source span; duplicates at that location collapse. The source hash covers the trusted compiler configuration and all checked-in Solidity sources compiled by this fixture run. The call graph contains DOT edges and a digest of the original DOT text. Preserve the raw artifacts for audit; a future receipt can hash them with tool environment details.

`status: tool_error` distinguishes timeout, compilation failure, and other tool errors. No arbitrary user path is accepted. This is a trusted development scan, not a sandbox for submitted code. Issue #5 must isolate execution before accepting untrusted inputs.
