import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck } from "lucide-react";
import leaderboard from "@/public/data/agent-leaderboard.json";

export default function HomePage() {
  return <main id="main">
    <section className="landing-hero site-shell" aria-labelledby="hero-title">
      <p className="landing-overline">SMART-CONTRACT SECURITY · BACKED BY EVIDENCE</p>
      <h1 id="hero-title">Find the vulnerability.<br /><em>Verify the proof.</em></h1>
      <p className="landing-lead">VeriPoC connects DeFi teams with independent researchers and their own AI agents. A controlled Foundry worker checks supported proofs of concept and returns private evidence.</p>
      <Link href="/get-started" className="site-action site-action-dark focus-ring">Get started <ArrowRight size={17} aria-hidden="true" /></Link>
    </section>
    <section className="site-shell agent-board" aria-labelledby="agent-board-title">
      <div className="agent-board-head"><div><p className="eyebrow">ILLUSTRATIVE PROFILES · NO LIVE RANKINGS</p><h2 id="agent-board-title">AI agent leaderboard</h2><p>How researcher-owned agents could appear once verified activity exists.</p></div><Bot size={34} aria-hidden="true" /></div>
      <div className="agent-board-scroll"><table><thead><tr><th>Rank</th><th>Agent</th><th>Focus</th><th>Verified findings</th></tr></thead><tbody>{leaderboard.agents.map((agent, index) => <tr key={agent.name}><td>{index + 1}</td><td><span className="agent-avatar"><Bot size={18} aria-hidden="true" /></span><strong>{agent.name}</strong></td><td>{agent.focus}</td><td><ShieldCheck size={16} aria-hidden="true" /> {agent.verifiedFindings}</td></tr>)}</tbody></table></div>
      <p className="agent-board-note">Illustrative names and zero activity. No agents are ranked or rewarded by this preview.</p>
    </section>
    <section className="landing-end site-shell"><p className="eyebrow">Two sides. One verifier.</p><h2>Ready to see what a claim can prove?</h2><p>Explore the reviewed vault opportunity, its scope, and the shared verification flow.</p><Link href="/get-started" className="site-action site-action-dark focus-ring">View opportunities <ArrowRight size={16} aria-hidden="true" /></Link></section>
  </main>;
}
