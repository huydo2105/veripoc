export type WalletSession = { authenticated: true; account: string; csrfToken: string };

export async function ensureWalletSession(): Promise<WalletSession> {
  const existing = await fetch("/v1/auth/me", { credentials: "same-origin", cache: "no-store" })
    .then(response => response.ok ? response.json() : null).catch(() => null);
  if (existing?.authenticated && typeof existing.account === "string" && typeof existing.csrfToken === "string") return existing;

  const { detectConcordiumProvider } = await import("@concordium/browser-wallet-api-helpers");
  const provider = await detectConcordiumProvider(2000);
  const accounts = await provider.requestAccounts();
  const account = accounts?.[0];
  if (!account) throw new Error("Select a Concordium account in the wallet.");
  const challengeResponse = await fetch("/v1/auth/concordium/challenge", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ account }),
  });
  const challenge = await challengeResponse.json();
  if (!challengeResponse.ok) throw new Error(challenge.error || "Could not request a wallet challenge.");
  const signature = await provider.signMessage(account, challenge.message);
  const verifyResponse = await fetch("/v1/auth/concordium/verify", {
    method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
    body: JSON.stringify({ account, challengeId: challenge.challengeId, signature }),
  });
  const session = await verifyResponse.json();
  if (!verifyResponse.ok) throw new Error(session.error || "Wallet signature could not be verified.");
  return session;
}
