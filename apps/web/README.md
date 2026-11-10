# Local verification console

This buildless page is served by `apps/api` at `http://127.0.0.1:8787`. See [API setup](../api/README.md). It shows live job status, Slither findings, Foundry output, receipt fields, and the public receipt digest from the checked-in vault fixtures.

The page is deliberately small. A full Next.js app, badge read, and Concordium transaction views belong to later issues. The receipt digest shown here is a local computed anchor candidate, not proof of an on-chain submission. A scanner finding is not an executed exploit verdict.
