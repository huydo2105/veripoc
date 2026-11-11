#!/usr/bin/env node
import { createApiServer } from "./server.mjs";

const port = Number(process.env.VERIPOC_PORT ?? 8787);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error("invalid VERIPOC_PORT");
const server = createApiServer({ token: process.env.VERIPOC_API_TOKEN });
server.listen(port, "127.0.0.1", () => console.log(`VeriPoC local API: http://127.0.0.1:${port}`));
