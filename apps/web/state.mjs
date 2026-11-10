export const FIXTURES = Object.freeze({
  vulnerable: Object.freeze({
    name: "Vulnerable vault",
    contract: "VulnerableVault",
    title: "Donation-driven vault share inflation",
    description: "A researcher claims a donation before a victim deposit can round the victim's shares to zero and let the attacker redeem the victim's assets.",
    expected: "Attacker ends with 201 asset units; victim receives zero shares.",
    invariant: "The trusted Foundry test requires zero victim shares, attacker balance of 201, and victim balance of zero.",
    oracle: "testVulnerableDonationReproduces"
  }),
  patched: Object.freeze({
    name: "Patched control",
    contract: "PatchedVault",
    title: "Same PoC against the patched vault",
    description: "The same donation sequence is replayed against a vault with virtual shares and one virtual asset.",
    expected: "Victim receives shares and the attacker cannot finish above the initial 101 asset units.",
    invariant: "The trusted Foundry test requires positive victim shares, attacker balance at most 101, and victim balance of zero after deposit.",
    oracle: "testPatchedDonationDoesNotReproduce"
  })
});

export const VERDICTS = Object.freeze({
  reproduced: Object.freeze({ label: "Reproduced", tone: "danger", explanation: "The fixed Foundry oracle passed for the vulnerable fixture. The claimed exploit reproduced under these tested local conditions." }),
  not_reproduced: Object.freeze({ label: "Not reproduced", tone: "success", explanation: "The fixed Foundry control oracle passed. The same attack did not profit the attacker under these tested local conditions." }),
  inconclusive: Object.freeze({ label: "Inconclusive", tone: "warning", explanation: "Execution did not reach a trustworthy verdict. Review the reason and rerun after resolving the condition." }),
  tool_error: Object.freeze({ label: "Tool error", tone: "warning", explanation: "The worker or its toolchain failed. No exploit conclusion can be drawn from this run." })
});

const validStates = new Set(["queued", "running", "finished"]);
const hex64 = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

export function parseAcceptance(value) {
  if (!value || typeof value !== "object" || !/^[a-f0-9-]{36}$/.test(value.id)
    || !validStates.has(value.state)) throw new Error("Unexpected job acceptance response");
  return value;
}

export function parseJob(value, expectedId, expectedFixture) {
  if (!value || typeof value !== "object" || value.id !== expectedId || value.kind !== "verify"
    || value.fixture !== expectedFixture || !validStates.has(value.state)) throw new Error("Unexpected job response from the API");
  if (value.state === "finished") {
    if (!value.result || !Object.hasOwn(VERDICTS, value.result.status)) throw new Error("Finished job has no supported verdict");
  } else if (value.result !== null) throw new Error("Unfinished job contains a result");
  return value;
}

export function stageStates(job) {
  if (!job) return ["pending", "pending", "pending", "pending"];
  if (job.state === "queued") return ["done", "pending", "pending", "pending"];
  if (job.state === "running") return ["done", "active", "pending", "pending"];
  const result = job.result;
  const decided = result.status === "reproduced" || result.status === "not_reproduced";
  return ["done", result.status === "tool_error" ? "failed" : "done",
    decided && result.receipt?.invariant?.passed === true ? "done" : "unavailable",
    result.receipt && hex64(result.anchor?.receiptSha256) ? "done" : "unavailable"];
}

export function financialEvidence(result) {
  if (!["reproduced", "not_reproduced"].includes(result?.status)
    || result?.receipt?.invariant?.passed !== true) return null;
  const evidence = result?.financialEvidence;
  const amount = value => typeof value === "string" && /^(0|[1-9]\d*)$/.test(value);
  if (!evidence || typeof evidence !== "object" || !amount(evidence.attackerBefore)
    || !amount(evidence.attackerAfter) || !amount(evidence.victimShares)) return null;
  return evidence;
}

export function receiptDigest(result) {
  return hex64(result?.anchor?.receiptSha256) && result?.receipt ? result.anchor.receiptSha256 : null;
}

export function apiError(status, message) {
  if (status === 401) return "API token rejected. Check the token and retry.";
  if (status === 429) return "Local rate limit reached. Wait a minute before retrying.";
  if (status === 503) return "The local job capacity is full. Review results and restart the API when ready.";
  return typeof message === "string" && message ? message : `API request failed (HTTP ${status}).`;
}
