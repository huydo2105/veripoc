export type Fixture = "vulnerable" | "patched";
export type JobState = "queued" | "running" | "finished";
export type Verdict = "reproduced" | "not_reproduced" | "inconclusive" | "tool_error";
export type Receipt = {
  invariant?: { passed?: boolean; name?: string };
  chain?: { chainId?: number; forkBlock?: number | null };
  input?: { imageId?: string; sourceSha256?: string };
  tools?: { forge?: string; solc?: string };
  evidence?: { executionLogSha256?: string };
};
export type JobResult = {
  status: Verdict;
  reason?: string;
  receipt?: Receipt | null;
  anchor?: { receiptSha256?: string } | null;
  financialEvidence?: { attackerBefore: string; attackerAfter: string; victimShares: string } | null;
};
export type Job = { id: string; kind: "verify"; fixture: Fixture; state: JobState; result: JobResult | null };
