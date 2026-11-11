# VeriPoC — Interactive product education, not animation theater
**Decision:** 2026-11-11 | Target after standard Next/Tailwind migration, Issue #39.
**Purpose:** users and hackathon judges should understand the two-sided product in under 30 seconds and be able to explore it without accounts or wallet setup.

## Inspiration and transferable mechanisms
- **Stripe Payment Links** (https://stripe.com/payments/payment-links): brief visual 3-step How It Works, followed by a **configurable interactive demo** on the same page. *Transfer:* each VeriPoC stage should be clickable and change the visible example UI, not just open more text.
- **Linear Start Guide** (https://linear.app/docs/start-guide): visitors can explore a demo workspace before signing up. *Transfer:* demo program and verifier preview are publicly discoverable, while authorized operations remain gated.
- **Framer's interactive-site examples** (https://www.framer.com/blog/interactive-websites/): step-oriented storytelling, lightweight microinteractions, and scroll-triggered sections. *Transfer:* moving visuals should illustrate inputs, verification and evidence rather than distract.
- **Motion** (https://motion.dev/docs/react): scroll-triggered `whileInView`, scroll-linked `useScroll`, reduced-motion `useReducedMotion`. *Transfer:* use motion for staged explanation with CSS transform/opacity; no autoplay exploit visualization masquerading as real work.

## Homepage information architecture
1. **Hero:** brand mark only in navigation, headline "Find vulnerabilities. Verify the evidence.", one-line subhead, exactly two equal role cards: 
   - **I have a smart contract to audit** -> `/teams/start`
   - **I want to audit** -> `/researchers/start`
   Clear tertiary link **Explore interactive demo** -> `/demo`. No long hero prose.
2. **Interactive workflow — sticky split view:** left 3 buttons with <= 10-word descriptions; right graphical preview updates as active step changes:
   - 01 **Authorize**: DeFi team creates Demo Vault Program; show tiny contract + scope card and invited researcher avatar (illustrative state).
   - 02 **Investigate**: external researcher agent submits a **share-inflation claim** and trusted PoC fixture; show compact agent-to-program arrow (illustrative; no fake actual integration).
   - 03 **Verify**: show an evidence report preview with separate `Reproduced` and `Not reproduced` controls; if live API not run, show "Example from reviewed fixture tests." Add CTA **Run real PoC** -> `/verify`.
   The user can click any stage at any time. Scrolling may softly advance stage, but must NOT steal focus, trap scroll, or auto-submit jobs.
3. **Proof comparison:** optional two-state toggle between **Vulnerable vault** and **Patched vault** with genuine reproducible fixture outcome copy. If using static fixture evidence, label as a **sample**. Never pretend a toggle ran Foundry.
4. **Concordium evidence:** simple 2-column diagram "Researcher/agent identity" + "Private receipt" leading to "Future Testnet hash anchor"; only show actual on-chain transaction if recorded in repository. Avoid fake explorer links.
5. **Short final CTA:** "See the verified result" -> `/verify`, no sales funnel, wallet prompt or sign-up wall.

## Animation choreography
- **On scroll:** section titles reveal with <= 16px translateY and opacity over 250–450ms; stagger role cards <=80ms if necessary. Keep body paragraphs visible by default for reduced-motion/no-JS.
- **Sticky storyboard:** right preview stays sticky on desktop during three left stages; active stage changes with scroll progress or accessible click. On mobile, use vertically stacked click-to-open panels and remove sticky.
- **Connector animation:** draw a single SVG connection path from owner -> agent -> verifier when stage changes, 300–450ms; static line for reduced-motion.
- **Role-card hover:** 2px translateY and gentle border-color transition; focus-visible ring.
- **Header:** lightweight translucency/border state after first section, never intrusive disappearing nav.
- **Evidence reveal:** when the `Verify` illustrative stage enters, a compact verdict panel appears; no terminal-code rain, particle effect, excessive parallax, loading timers, fake scan progress or autoplay financial counters.
- **Route transition:** <= 180ms opacity for non-critical page navigation only; no delayed job status or blocked form.
- `prefers-reduced-motion`: no parallax/scroll linked transforms; all text and interactions work with JS disabled where feasible.

## User-visible content limits
- Hero description 1 sentence / max ~130 characters.
- Each role card: title + <= 18-word description + single action.
- Three steps: <= 10-word labels; popover/details only on user request.
- Onboarding: one central diagram or card, 1 real CTA, links to technical details hidden under disclosure.
- Verification console: preserve critical explanations for security and trust; collapse technical trace details instead of removing them.

## A11y, performance, and trust requirements
- Semantic `button` tabs or radio-like controls, `aria-selected`/`aria-controls` as appropriate, keyboard arrows where expected; visible focus.
- Preserve content visibility when JavaScript not running, especially hero and two role links.
- Avoid autoplay sound, motion-heavy loops, custom cursor, scroll hijacking, infinite horizontal sections, WebGL/3D (not justified for product).
- Target good LCP/CLS/INP; use built-in Next image and font optimizations, small client-side bundles; Motion only in interactive islands.
- Real `/verify` must call existing authenticated Node API, not simulated UI. Agent REST/MCP, scope authorization and anchoring remain pending until #13/#35/#10.
- Test with keyboard, mobile touch, 320/390 widths, `prefers-reduced-motion` and Playwright UI screenshots.

## User testing checklist
- Can a judge understand each persona immediately?
- Can they reach `/demo` in one click and `/verify` in another?
- Can they click each stage without reading entire paragraphs?
- Are static examples **explicitly distinct** from live verification status?
- Can they switch back and forth between team/researcher path?
- Does the scroll animation reinforce understanding rather than obstruct navigation?
