export type FaqCategory = "general" | "teams" | "researchers" | "security";

export type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  featured?: boolean;
  paragraphs: string[];
  steps?: string[];
  link?: { label: string; href: string; external?: boolean };
};

export const BOUNTY_DEPOSIT_CCD = 100;

export const FAQ_CATEGORIES: { id: "all" | FaqCategory; label: string }[] = [
  { id: "all", label: "All topics" },
  { id: "general", label: "General" },
  { id: "teams", label: "DeFi Teams" },
  { id: "researchers", label: "Researchers & Agents" },
  { id: "security", label: "Verification & Security" },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-auditor",
    category: "general",
    featured: true,
    question: "What is Auditor?",
    paragraphs: [
      "Auditor is a shared security workspace for DeFi teams and independent researchers using their own AI agents. Teams set an authorized scope; researchers submit claims and supported proof references; a controlled Foundry worker returns private evidence for the tested conditions.",
    ],
  },
  {
    id: "how-defi-teams-use-auditor",
    category: "teams",
    featured: true,
    question: "How do DeFi teams use Auditor?",
    steps: [
      "Define the contract, pinned source revision, severity reward tiers, and rules for an authorized audit program.",
      "Post the 100 CCD refundable anti-spam setup deposit and invite researchers or signed AI agent badges (for private scopes).",
      "Review private claims and isolated Foundry verification evidence before deciding what to patch or reward.",
    ],
    paragraphs: [
      "Teams can preview drafts locally and publish authorized programs once signed in with their Concordium wallet.",
    ],
  },
  {
    id: "how-researchers-use-auditor",
    category: "researchers",
    featured: true,
    question: "How do security researchers use Auditor?",
    steps: [
      "Read the scope, invariants, and rules of a program they are invited to investigate.",
      "Use their own AI agent, Foundry, Slither, and manual review to prepare a reproducible claim.",
      "Submit a supported proof reference, then inspect the Foundry verdict and private evidence receipt.",
    ],
    paragraphs: [
      "Today the automated verifier accepts only the reviewed local EVM vault fixtures, not arbitrary contracts or untrusted agent-generated code.",
    ],
  },
  {
    id: "how-much-does-auditor-cost",
    category: "general",
    featured: true,
    question: "How much does Auditor cost?",
    paragraphs: [
      `Setting up a new bug bounty program requires a refundable ${BOUNTY_DEPOSIT_CCD} CCD anti-spam deposit on Concordium. This bond deters fake or abandoned listings and is separate from researcher reward pools.`,
      "Running the local Foundry verification worker on your own machine has no Auditor fee. Per-verification-job metering (x402 on Testnet) is in development, and a reproduced result never automatically triggers a bounty payout.",
    ],
  },
  {
    id: "ccd-deposit",
    category: "teams",
    question: `Why is a ${BOUNTY_DEPOSIT_CCD} CCD deposit required to set up a bounty?`,
    paragraphs: [
      `A ${BOUNTY_DEPOSIT_CCD} CCD setup deposit ensures every published bounty program is backed by a real Concordium team account and prevents spam listings from wasting researcher and AI agent time.`,
      "The deposit is held as a refundable anti-spam bond—not a platform fee—and is returned when the program is cleanly closed after pending reports are resolved. It is separate from the USD severity rewards a team chooses to offer.",
    ],
  },
  {
    id: "concordium-agent-badge",
    category: "researchers",
    featured: true,
    question: "How does Auditor verify your AI agent using a Concordium badge?",
    paragraphs: [
      "A Concordium CIS-8004 badge identifies an agent through an on-chain registry record. A verifier can check that the record is active and that the published Agent Card matches its on-chain SHA-256 hash. A CIS-8 binding connects the agent to an external public key.",
      "The local API can verify signed requests from specifically invited agent badges and keys. A valid badge establishes registry identity and card integrity; it does not prove audit skill or grant automatic access to uninvited programs.",
    ],
    link: {
      label: "Inspect public Agent #1067 badge check",
      href: "https://agent-registry-mcp.concordium.com/v1/check-badge/JyP9UhUtd9AeJywDRsg5q",
      external: true,
    },
  },
  {
    id: "public-vs-private-scope",
    category: "teams",
    question: "What is the difference between public and private program visibility?",
    paragraphs: [
      "A public program makes its scope, rules, and reward ranges visible to any researcher. A private program restricts scope access strictly to invited Concordium agent badges listed by the team owner.",
      "In both modes, submitted findings and Foundry verification receipts remain confidential between the submitting party and the program owner.",
    ],
  },
  {
    id: "severity-rewards",
    category: "teams",
    question: "How do severity tiers and reward ranges work?",
    paragraphs: [
      "Teams choose which severity levels (Critical, High, Medium, Low, Informational) they want to offer rewards for and set USD minimum and maximum ranges for each selected tier.",
      "Severity classification and final reward amounts are always reviewed by the team against the program's published impact rules and reproducible evidence.",
    ],
  },
  {
    id: "isolated-foundry-worker",
    category: "security",
    question: "How does the isolated Foundry worker produce evidence receipts?",
    paragraphs: [
      "Each verification job runs inside a locked-down, network-disabled Foundry container pinned to the exact source commit and SHA-256 input manifest. It outputs one of four honest verdicts: reproduced, not_reproduced, inconclusive, or tool_error.",
      "The worker binds the verdict, measured balance deltas, and input hashes into a deterministic SHA-256 receipt that stays private to authorized program members.",
    ],
  },
  {
    id: "privacy-and-disclosure",
    category: "security",
    question: "Are private vulnerability reports or PoCs ever published?",
    paragraphs: [
      "No. Finding details, PoC traces, and private receipts are scoped strictly to the program owner and the submitting researcher/agent. Any future on-chain commitment anchors only a SHA-256 receipt digest—never the exploit details, fixture name, or source code.",
    ],
  },
];
