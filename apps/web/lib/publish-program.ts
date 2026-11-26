import { ensureWalletSession } from "@/lib/wallet-session";

type DraftValues = Record<string, string>;
export type ContactChannel = "email" | "x" | "linkedin" | "discord" | "telegram" | "github" | "website";
export type ContactInput = { channel: ContactChannel; value: string };
export type RewardInput = { severity: string; min: string; max: string };
export type ReferenceInput = { kind: "source" | "documentation" | "deployment"; name: string; url: string };

const ALL_SEVERITIES = ["critical", "high", "medium", "low", "informational"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function serializeContacts(contacts: ContactInput[]): string {
  const filled = contacts.map(item => ({ channel: item.channel, value: item.value.trim() })).filter(item => item.value);
  if (!filled.length) return "";
  if (filled.length === 1 && filled[0].channel === "email") return filled[0].value;
  return filled.map(item => `${item.channel}: ${item.value}`).join(" | ");
}

export async function publishProgram(
  values: DraftValues,
  rewards: RewardInput[],
  references: ReferenceInput[],
  contacts: ContactInput[] = [],
  selectedSeverities: string[] = [...ALL_SEVERITIES],
): Promise<string> {
  const targets = values.scope.trim().split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  const runLimit = Number(values.runLimit);
  if (!/^[a-fA-F0-9]{40}([a-fA-F0-9]{24})?$/.test(values.sourceRevision.trim())
    || !["evm-local", "evm-testnet", "solana-testnet"].includes(values.chain.trim())
    || !Number.isInteger(runLimit) || runLimit < 1 || runLimit > 20 || targets.length > 10) {
    throw new Error("Check the source revision, chain, target list, and run limit before publishing.");
  }

  for (const item of contacts) {
    const trimmed = item.value.trim();
    if (!trimmed) continue;
    if (item.channel === "email" && !EMAIL_RE.test(trimmed)) {
      throw new Error("Enter a valid email address for the email contact.");
    }
    if (item.channel !== "email" && !/^https:\/\/[^\s]+$/.test(trimmed)) {
      throw new Error(`Enter a valid https:// link for ${item.channel}.`);
    }
  }

  const selectedSet = new Set(selectedSeverities);
  const rewardBySeverity = new Map(rewards.map(item => [item.severity, item]));
  const rewardTiers = ALL_SEVERITIES.map(severity => {
    if (!selectedSet.has(severity)) return { severity, min: 0, max: 0 };
    const item = rewardBySeverity.get(severity) ?? { severity, min: "0", max: "0" };
    if (item.min.trim() === "" || item.max.trim() === "") {
      throw new Error("Each selected severity needs a valid minimum and maximum in USD.");
    }
    const min = Number(item.min);
    const max = Number(item.max);
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 0 || max < min || max > 100_000_000) {
      throw new Error("Each selected severity needs a valid minimum and maximum in USD.");
    }
    return { severity, min, max };
  });

  if (references.some(item => !item.name.trim() || !item.url.trim())) throw new Error("Complete or remove each reference row.");
  const rules = [values.instructions, values.invariants, values.submission, values.agentRules, values.policy,
    values.eligibility].filter(Boolean).join("\n\n");
  if (rules.length > 2000) throw new Error("Combined rules exceed 2,000 characters. Shorten the instructions before publishing.");

  const agentBadges = values.visibility === "private" && values.agentBadge?.trim()
    ? [...new Set(values.agentBadge.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean))]
    : [];
  if (agentBadges.length > 20) throw new Error("You can invite up to 20 agent badges per program.");

  const contact = serializeContacts(contacts) || values.contact?.trim() || "";
  const session = await ensureWalletSession();
  const body = {
    name: values.name.trim(), sourceUrl: values.sourceUrl.trim(), sourceRevision: values.sourceRevision.trim(),
    chain: values.chain.trim(), confidentiality: "members-only", visibility: values.visibility,
    contact, docsUrl: values.docsUrl?.trim() || "",
    agentContext: values.agentContext?.trim() || "", permittedTargets: targets, rules,
    exclusions: values.outOfScope?.trim() || "No targets outside the permitted list.", runLimit,
    rewardCurrency: "USD", rewardTiers,
    references: references.map(item => ({ kind: item.kind, name: item.name.trim(), url: item.url.trim() })),
    invitedResearcherAccounts: [],
    invitedAgentBadges: agentBadges,
  };
  const response = await fetch("/v1/programs", { method: "POST", credentials: "same-origin",
    headers: { "content-type": "application/json", "x-auditor-csrf": session.csrfToken }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Program could not be saved.");
  return result.program.id;
}
