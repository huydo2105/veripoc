import { ensureWalletSession } from "@/lib/wallet-session";

type DraftValues = Record<string, string>;
export type RewardInput = { severity: string; min: string; max: string };
export type ReferenceInput = { kind: "source" | "documentation" | "deployment"; name: string; url: string };

export async function publishProgram(values: DraftValues, rewards: RewardInput[], references: ReferenceInput[]): Promise<string> {
  const targets = values.scope.trim().split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  const runLimit = Number(values.runLimit);
  if (!/^[a-fA-F0-9]{40}([a-fA-F0-9]{24})?$/.test(values.sourceRevision.trim())
    || !["evm-local", "evm-testnet", "solana-testnet"].includes(values.chain.trim())
    || !Number.isInteger(runLimit) || runLimit < 1 || runLimit > 20 || targets.length > 10) {
    throw new Error("Check the source revision, chain, target list, and run limit before publishing.");
  }
  const rewardTiers = rewards.map(item => ({ severity: item.severity, min: Number(item.min), max: Number(item.max) }));
  if (rewards.some(item => item.min.trim() === "" || item.max.trim() === "")
    || rewardTiers.some(item => !Number.isSafeInteger(item.min) || !Number.isSafeInteger(item.max)
    || item.min < 0 || item.max < item.min || item.max > 100_000_000)) {
    throw new Error("Each reward range needs a valid minimum and maximum in USD.");
  }
  if (references.some(item => !item.name.trim() || !item.url.trim())) throw new Error("Complete or remove each reference row.");
  const rules = [values.instructions, values.invariants, values.submission, values.agentRules, values.policy,
    values.eligibility].filter(Boolean).join("\n\n");
  if (rules.length > 2000) throw new Error("Combined rules exceed 2,000 characters. Shorten the instructions before publishing.");
  const session = await ensureWalletSession();
  const body = {
    name: values.name.trim(), sourceUrl: values.sourceUrl.trim(), sourceRevision: values.sourceRevision.trim(),
    chain: values.chain.trim(), confidentiality: "members-only", visibility: values.visibility,
    contact: values.contact?.trim() || "", docsUrl: values.docsUrl?.trim() || "",
    agentContext: values.agentContext?.trim() || "", permittedTargets: targets, rules,
    exclusions: values.outOfScope?.trim() || "No targets outside the permitted list.", runLimit,
    rewardCurrency: "USD", rewardTiers,
    references: references.map(item => ({ kind: item.kind, name: item.name.trim(), url: item.url.trim() })),
    invitedResearcherAccounts: values.visibility === "private" && values.researcherAccount?.trim() ? [values.researcherAccount.trim()] : [],
    invitedAgentBadges: values.visibility === "private" && values.agentBadge?.trim() ? [values.agentBadge.trim()] : [],
  };
  const response = await fetch("/v1/programs", { method: "POST", credentials: "same-origin",
    headers: { "content-type": "application/json", "x-veripoc-csrf": session.csrfToken }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Program could not be saved.");
  return result.program.id;
}
