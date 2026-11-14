import Link from "next/link";
import { VerificationConsole } from "@/components/verification/verification-console";

export default function SubmitReportPage() { return <main id="main" className="site-shell submit-report"><Link href="/opportunities/demo-vault" className="back-link focus-ring">← Vault scope</Link><h1>Submit a reviewed claim.</h1><p>The current local flow verifies a reviewed PoC fixture. Confidential finding submission and bounty enrollment are planned.</p><VerificationConsole embedded /></main>; }
