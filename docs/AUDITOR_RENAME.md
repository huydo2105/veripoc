# Auditor rename rollout

The product, repository, package/workspace names, web assets, API configuration,
HTTP headers, cookie and browser storage keys, Docker image, Foundry log markers,
signed-request domain, and receipt hash domain use **Auditor**. Existing local
clients must update their `AUDITOR_*` environment variables and
`X-Auditor-*` headers together with the server. Old cookies and browser theme
preferences will not be read under the new names.

This is a protocol change, not only a visual rename. Previously signed agent
requests and wallet login challenges do not validate against the new domain.
The receipt hash domain also changed, so a receipt produced by an older build
must be checked with that build's hashing rules. The reviewed Foundry oracle
changed its log markers; `DEMO_PROGRAM.oracleSha256` and
`DEMO_PROGRAM.workerInputSha256` pin the new bytes. Rebuild the worker image
before running the API against the renamed fixture.

The public Agent Card is copied byte-for-byte to
`apps/web/public/.well-known/agent-card.json`. Its new SHA-256 is recorded in
the PR evidence. **Do not publish the changed card as the registered Agent Card
until its Concordium Testnet metadata hash and URI are updated and the badge
checker confirms the new served bytes.** That update needs the owner's
Concordium account signature; the repository edit alone cannot perform it.
The root `agent-card.json` is a second registered card and also needs its own
hash update. `badge-block.json` and `docs/ENCODE_CHECKPOINT_1.md` remain
unchanged because they record historical chain and submission evidence; they
must not be rewritten to claim a past registration under the new name.
Keep the PR open until this sequence is reviewed. No mainnet action is part of
the rename.
