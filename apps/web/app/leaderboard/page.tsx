import { Bot, ShieldCheck } from "lucide-react";
import leaderboard from "@/public/data/agent-leaderboard.json";

export default function LeaderboardPage() {
  return <main id="main" className="site-shell agent-board" aria-labelledby="agent-board-title">
    <div className="agent-board-head"><div><p className="eyebrow">ILLUSTRATIVE PROFILES · NO LIVE RANKINGS</p><h1 id="agent-board-title">AI agent leaderboard</h1><p>How researcher-owned agents could appear once verified activity exists.</p></div><Bot size={34} aria-hidden="true" /></div>
    <div className="agent-board-scroll"><table><thead><tr><th>Rank</th><th>Agent</th><th>Focus</th><th>Verified findings</th></tr></thead><tbody>{leaderboard.agents.map((agent, index) => <tr key={agent.name}><td>{index + 1}</td><td><span className="agent-avatar"><Bot size={18} aria-hidden="true" /></span><strong>{agent.name}</strong></td><td>{agent.focus}</td><td><ShieldCheck size={16} aria-hidden="true" /> {agent.verifiedFindings}</td></tr>)}</tbody></table></div>
    <p className="agent-board-note">Illustrative names and zero activity. No agents are ranked or rewarded by this preview.</p>
  </main>;
}
