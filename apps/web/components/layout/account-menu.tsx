"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Inbox, LogOut, ShieldCheck, SlidersHorizontal, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";

type ProgramRole = "team" | "researcher";

export type WalletSession = {
  authenticated: true;
  account: string;
  onboardingRole: ProgramRole | null;
  programRoles: Record<string, ProgramRole>;
  csrfToken: string;
  expiresAt?: number;
};

function shortAddress(account: string): string {
  return account.length > 14 ? `${account.slice(0, 6)}…${account.slice(-4)}` : account;
}

function roleSummary(session: WalletSession): string {
  const demoRole = session.programRoles["demo-vault"];
  if (demoRole === "team") return "Demo Vault · Team";
  if (demoRole === "researcher") return "Demo Vault · Researcher";
  if (session.onboardingRole === "team") return "Onboarding · DeFi team";
  if (session.onboardingRole === "researcher") return "Onboarding · Researcher";
  return "Connected · No program role";
}

export function AccountMenu() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      toast.error(error, { id: "wallet-auth-error", testId: "wallet-auth-error", duration: Infinity });
    } else {
      toast.dismiss("wallet-auth-error");
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    fetch("/v1/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (active && data?.authenticated && typeof data.account === "string") setSession(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!menuOpen && !error) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setError(null);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [menuOpen, error]);

  async function connectConcordium() {
    setBusy(true);
    setError(null);
    try {
      const { detectConcordiumProvider } = await import("@concordium/browser-wallet-api-helpers");
      let provider;
      try {
        provider = await detectConcordiumProvider(2000);
      } catch {
        setError("Concordium Browser Wallet not detected. Install or unlock the extension to connect.");
        return;
      }
      let account: string | undefined;
      if (typeof provider.requestAccounts === "function") {
        const accounts = await provider.requestAccounts();
        account = accounts?.[0];
      }
      if (!account && typeof provider.connect === "function") {
        account = await provider.connect();
      }
      if (!account) {
        setError("No Concordium account was selected in the wallet.");
        return;
      }
      setWalletAccount(account);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wallet connection was cancelled or failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function selectOnboardingRole(requestedRole: ProgramRole) {
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/v1/auth/role", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-veripoc-csrf": session.csrfToken,
        },
        body: JSON.stringify({ requestedRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authenticated) {
        setError(data.error || "Unable to update onboarding role.");
        return;
      }
      setSession(data);
    } catch {
      setError("Unable to reach the verification API.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "x-veripoc-csrf": session.csrfToken },
      });
      if (!response.ok) {
        setError("Could not sign out. Your VeriPoC session is still active.");
        return;
      }
      setSession(null);
      setMenuOpen(false);
    } catch {
      setError("Could not sign out. Your VeriPoC session is still active.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={wrapRef} className="account-menu-wrap">
      {!session && !walletAccount ? (
        <button
          type="button"
          className="header-connect-btn focus-ring"
          onClick={connectConcordium}
          disabled={busy}
          aria-label="Connect Concordium wallet"
        >
          <Wallet size={15} aria-hidden="true" />
          <span className="header-connect-label">{busy ? "Connecting…" : "Connect Concordium"}</span>
        </button>
      ) : !session ? (
        <div className="account-authed">
          <button
            type="button"
            className="header-connect-btn focus-ring"
            aria-expanded={menuOpen}
            aria-label={`Connected wallet ${shortAddress(walletAccount!)}`}
            onClick={() => setMenuOpen(open => !open)}
          >
            <Wallet size={15} aria-hidden="true" />
            <span className="header-connect-label">{shortAddress(walletAccount!)}</span>
          </button>
          {menuOpen && (
            <div className="account-dropdown" role="group" aria-label="Connected Concordium wallet">
              <div className="account-dropdown-head">
                <strong className="mono-data" data-testid="wallet-only-account">{shortAddress(walletAccount!)}</strong>
                <span className="account-role-pill">Wallet connected</span>
              </div>
              <div className="account-dropdown-links">
                <Link href="/profile/projects" className="account-dropdown-item focus-ring" onClick={() => setMenuOpen(false)}><UserRound size={15} aria-hidden="true" /><span>Profile</span></Link>
                <button type="button" className="account-dropdown-item focus-ring" aria-label="Disconnect wallet from this page" onClick={() => {
                  setWalletAccount(null);
                  setMenuOpen(false);
                }}>
                  <LogOut size={15} aria-hidden="true" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="account-authed">
          <Link
            href="/programs/demo-vault"
            className="header-icon-btn focus-ring"
            aria-label="Program inbox"
            title="Program inbox"
          >
            <Inbox size={17} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="header-avatar-btn focus-ring"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${shortAddress(session.account)}`}
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className="header-avatar-mark" aria-hidden="true">{session.account.slice(0, 2).toUpperCase()}</span>
          </button>
          {menuOpen && (
            <div className="account-dropdown" role="menu" aria-label="Connected Concordium account">
              <div className="account-dropdown-head">
                <strong className="mono-data" data-testid="connected-account">{shortAddress(session.account)}</strong>
                <span className="account-role-pill" data-testid="connected-role">{roleSummary(session)}</span>
              </div>
              <div className="account-role-picker">
                <span className="account-role-label">Onboarding role</span>
                <div className="account-role-group" role="group" aria-label="Onboarding role preference">
                  <button
                    type="button"
                    className={"account-role-btn focus-ring " + (session.onboardingRole === "team" ? "is-active" : "")}
                    aria-pressed={session.onboardingRole === "team"}
                    disabled={busy}
                    onClick={() => selectOnboardingRole("team")}
                  >
                    DeFi team
                  </button>
                  <button
                    type="button"
                    className={"account-role-btn focus-ring " + (session.onboardingRole === "researcher" ? "is-active" : "")}
                    aria-pressed={session.onboardingRole === "researcher"}
                    disabled={busy}
                    onClick={() => selectOnboardingRole("researcher")}
                  >
                    Researcher
                  </button>
                </div>
                <p className="account-role-note">Preference only; program access is granted by the server.</p>
              </div>
              <div className="account-dropdown-links">
                <Link href="/profile/projects" className="account-dropdown-item focus-ring" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <UserRound size={15} aria-hidden="true" /><span>Profile</span>
                </Link>
                <Link href="/programs/demo-vault" className="account-dropdown-item focus-ring" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>Authorized Demo Vault</span>
                </Link>
                <Link href="/teams/new" className="account-dropdown-item focus-ring" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  <span>Create a program</span>
                </Link>
                <button
                  type="button"
                  className="account-dropdown-item account-signout focus-ring"
                  role="menuitem"
                  disabled={busy}
                  onClick={signOut}
                >
                  <LogOut size={15} aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
