# Team-owned programs (Issue #51)

The existing Demo Vault is a preconfigured, working Foundry verification program. New team-owned programs are **scope records only**. A team may publish their scope publicly or keep it private and invite researchers. Their `verification` field is `not-configured`; creating one does not authorize arbitrary contract execution, report ingestion, or payout.

## Local setup

Set the existing API token and wallet authentication environment, plus:

```text
VERIPOC_TEAM_ACCOUNTS=<comma-separated Concordium team account addresses>
VERIPOC_ALLOWED_ORIGINS=http://localhost:3000
VERIPOC_PROGRAM_STORE=.local/programs.json
```

The API binds ownership to the account that signs its Concordium challenge, and allows creation only when that account appears in `VERIPOC_TEAM_ACCOUNTS`. Merely connecting a wallet in the header does not create a server session. On `/teams/new`, **Publish authorized program** requests a wallet signature when needed. A successful response shows a saved program link; a failed request leaves the local preview unsaved.

Optional AI drafting for the final **Agent setup** step requires `OPENAI_API_KEY` on the API server. `VERIPOC_AGENT_SETUP_MODEL` can override the default model. The API sends earlier draft steps to OpenAI with `store: false`, returns editable setup text, and never expands program authority. Without a key, enter the setup manually.

Run the API and web as in the existing local setup. Visit `/teams/new`, enter a full 40-character Git commit or 64-character digest, explicit target paths, rules and exclusions, one of `evm-local`, `evm-testnet`, or `solana-testnet`, and a run limit of 1–20. Add up to twelve named source, documentation, or deployment references, and proposed USD minimum and maximum rewards for each severity. Set the program to public or private. A public program appears in Opportunities and everyone may read its published scope. For a private program, invite a researcher account or badge. The owner can revisit programs through **Profile → Our projects**, manage invitations on each program page, and pause or resume. An invited researcher can open a private program link with their own wallet session. Pause and revocation remove researcher access. Closing a program is an API-only terminal action for now.

The store writes a complete JSON snapshot to a temporary file, syncs it, then renames it. It is intended for one local API process, with no multi-replica locking or production database guarantees. The file contains private program rules and invitations; keep it out of source control and back it up before deleting the local data directory. Wallet sessions themselves remain in memory and must be renewed after an API restart.

## Access boundaries

- Team account allowlist grants creation, and the signed account becomes the owner. A self-selected onboarding role grants no program rights.
- Only owner and currently invited researcher accounts can read private scope. Researcher views hide other invitation entries. Signed agent reads require the program's badge invitation and the configured agent signature verifier. Public scope is read-only for all visitors, including external agents; public status does not enroll an agent, accept reports, or open private jobs. Program bearer tokens and the operator bearer token cannot enter these routes.
- Owner-only mutations require the session CSRF token and same origin. Source visibility alone does not grant access.
- New program submission and job lists are empty. The fixed Demo Vault retains its separate working verifier and private receipts. Connecting general programs to a hardened worker and report workflow is later work.
