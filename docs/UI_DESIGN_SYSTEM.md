# VeriPoC UI Design System — Minimal, Evidence-First
**Decision:** 2026-11-11 | **Stage:** Design specification for Issue #34 / PR #37 and subsequent pages.
**Not a claim that the deployed UI has been redesigned.** The visual system is to be applied and tested in the open PR, reviewed by the owner before merge.

## Research and base templates
Use a **custom lightweight composition**, not a bulky template transplant.
- **Vercel Geist design system** — primary typography, restrained grayscale/color hierarchy and compact product UI: https://vercel.com/geist/introduction ; https://vercel.com/geist/typography ; https://vercel.com/geist/colors
- **shadcn/ui blocks** — reusable, accessible layout patterns to adapt *if the repo actually needs React*; no migration just for shadcn: https://ui.shadcn.com/blocks and https://ui.shadcn.com/blocks/dashboard
- **Radix Themes** — accessibility and interaction rules, not a requirement to install new dependencies: https://www.radix-ui.com/themes/docs/components
- **Linear's calm 2026 interface refresh** — philosophy: reduce chrome, muted navigation, minimal badges and separators: https://linear.app/now/behind-the-latest-design-refresh

## Visual direction: modern Swiss editorial x quiet fintech
Default **light** interface for immediate judge readability, with a dark ink text and forest-green accent. No faux-terminal cyberpunk, neon gradients, noisy charts, full-bleed illustrations, or promotional stock imagery. Dark mode is optional and must not delay MVP.

### Design tokens
```css
:root {
  --page: #F8F9F7;
  --surface: #FFFFFF;
  --text: #171F1B;
  --muted: #68716C;
  --border: #E0E5E0;
  --accent: #276C55;
  --accent-hover: #1F5645;
  --accent-subtle: #EAF3ED;
  --success: #287A51;
  --warning: #95622A;
  --danger: #B94E47;
  --radius-card: 14px;
  --radius-control: 8px;
  --max-content: 1160px;
}
```
All foreground/background pairs need tested WCAG AA contrast; don't use muted low contrast for small essential labels.

### Typography
- Primary: **Geist Sans** or system fallback (`Inter, ui-sans-serif, system-ui, sans-serif`).
- Data only: **Geist Mono** / monospace for hashes, tx ids, job IDs, source references and timestamps.
- Hero: clamp(42px, 6vw, 76px), weight 500–600, letter spacing -0.045em, line-height 1.08.
- H2: 32–42px, weight 500–600; cards H3: 19–23px.
- Body: 15–17px, line-height 1.65; secondary: 13–14px; meaningful labels min 12px.
- Keep line length for explanations <= 70 characters; avoid all-caps paragraphs.

### Layout and interaction
- Max width 1160px; content padding 24px (mobile 20px); 8pt spacing grid; 1px soft borders.
- Exactly **two equal-size primary homepage entry cards** above fold:
  1. **I have a smart contract to audit** -> /teams/start
  2. **I want to audit** -> /researchers/start
- Each card contains one recognizable icon, headline, one-sentence description, one clear next-step label; full card clickable with visible keyboard focus.
- Top navigation: logo + How it works + For teams + For researchers. Avoid 5+ CTA buttons.
- Sequence below hero: **Authorize → Investigate → Verify**. Explain “not a full automated audit.”
- No custom animations except optional 150–200ms hover and reduced-motion support.
- Use short, outcome-oriented button labels; show state plainly (`Demo only`, `Running`, `Reproduced`, `Not reproduced`, `Inconclusive`, `Error`).
- All nonfunctional controls: **remove** or clearly label `Coming later`; never present mock backend behaviors as production.
- Screenreader headings, skip link, focus rings, semantic navigation and error summaries.

## Essential screens (same design language)
1. **Home:** massive readable promise, two role cards, three-step explainer. No scanner CTA.
2. **DeFi teams:** Program overview with authorized scope, approved invited researchers, private findings. During #34 it is a labeled demo/preview, not real program persistence.
3. **Researchers:** authorized program + rules, bring-your-own-agent introduction, submit approved reviewed PoC. #13 external agent integrations should be marked planned until implemented.
4. **Verification console (#8):** real job status and Foundry verdict front and center; trace/receipt details in disclosure sections. Preserve existing engine, API and auth.
5. **Evidence detail:** one high-signal verdict; measured deltas, pinned environment and copyable private receipt hash; no invented metrics or Testnet links.
6. **Team triage / patch retest (#36):** same visual language; separate test verdict from triage or bounty status.

## Judge usability acceptance
- In <=10 seconds a judge can identify both audiences and VeriPoC's purpose.
- In <=2 clicks from either home card, a judge can reach the verified demo case (after authentication or explicit safe local setup).
- One primary CTA per screen; no dead buttons, bogus stats or confusing dashboard widgets.
- Viewport QA: 1440px, 1024px, 390px, 320px. No horizontal scroll.
- Keyboard-only navigation, clear focus, adequate contrast, reduced motion, no misleading simulated verification.
- Preserve actual working isolated worker, receipts, local token handling and shared verification route.

## Code adoption instructions (PR #37 / Issue #34)
- **Do not migrate the buildless HTML/CSS/JS frontend to React or Next.js solely to install shadcn.** Use design ideas, not the full stack.
- Retheme/recompose the existing PR #37 homepage and both onboarding pages; retain URL contracts, fixed-fixture limitation, role navigation and the existing Issue #8 verifier.
- Coordinate styling of the verifier minimally so it looks like one product; larger refactor is a separately approved issue.
- Provide before/after screenshots from an actual browser if available; if unavailable explicitly state this limitation.
- Keep PR #37 open for human review; follow AGENTS.md stop-after-PR.
