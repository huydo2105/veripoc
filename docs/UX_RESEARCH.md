# Issue #34: homepage UX research and decisions

**Reviewed:** 2026-11-11. This is a design review of public platform pages and published usability guidance, not a VeriPoC user study or a claim that these patterns have been validated with our users. The requested `docs/UI_DESIGN_SYSTEM.md` was absent from this branch when work began; the supplied Issue #34 revision brief provides the color and typography specification used here.

## Observed platform patterns

| Source | What the source shows | VeriPoC decision |
| --- | --- | --- |
| [HackerOne platform](https://www.hackerone.com/) and [program inbox help](https://docs.hackerone.com/en/articles/8510351-inbox) | The public product connects discovery, validation, and remediation; organization reports flow into a program inbox for review. | Team onboarding names the future confidential finding destination and separates the current verifier from planned team triage. We do not draw a fake inbox. |
| [Immunefi](https://immunefi.com/) | The public navigation separates protocol-facing security offerings from researcher opportunities, including an `Explore Bounties` path. | The homepage gives teams and researchers equal, recognizable routes. The local demo does not imply a live bounty marketplace or payouts. |
| [Code4rena competition docs](https://docs.code4rena.com/competitions) and [current status](https://code4rena.com/) | Historically, sponsors provided a review scope, wardens investigated, and judges decided finding validity. The site now says Code4rena is winding down. | We retain the useful distinction between scoped investigation, submitted evidence, and human judgment. We do not copy contest, prize-pool, disclosure, or lifecycle choices from a winding-down platform. |
| [Vercel Geist](https://vercel.com/geist/introduction) and [typography guidance](https://vercel.com/geist/typography) | Its system emphasizes consistent type, spacing, and accessible contrast rather than decorative imagery. | We use a restrained type scale, simple borders, whitespace, and Geist-first font fallback. We do not install a React design system or claim the proprietary font is bundled. |
| [shadcn/ui blocks](https://ui.shadcn.com/blocks) and [card anatomy](https://ui.shadcn.com/docs/components/base/card) | Cards group a title, explanation, and action into a scannable unit. | Each VeriPoC role is one native anchor wrapping its icon, title, description, and action. This gives one destination and keyboard access without a framework migration. |

## General usability guidance, applied with care

| Source | Recommendation | Application and limit |
| --- | --- | --- |
| [Nielsen Norman Group homepage guidelines](https://www.nngroup.com/articles/113-design-guidelines-homepage-usability/) | State the site's purpose immediately, emphasize a small number of priority tasks, and use meaningful link text. | The outcome headline, explanatory subtitle, and two role cards appear before the three-step explanation. This is older general homepage guidance, not a measured conversion result for VeriPoC. |
| [Baymard homepage research](https://baymard.com/research-articles/ecommerce-homepage-ux) | Make clickable areas and destinations unmistakable; the homepage should remain a navigational anchor. | A full-card hit area has a single route. Home and cross-journey links remain visible; mobile cards stack. Baymard studies commerce navigation, so this is a transferable interaction principle, not direct evidence about security researchers. |

## Design decisions and capability truth

1. **Outcome before mechanics.** “Find vulnerabilities. Verify the evidence.” tells a judge the purpose before mentioning Foundry, receipts, or Concordium. The subtitle identifies both audiences and researcher-owned agents.
2. **Two equal paths, one destination for execution.** The cards are the only prominent homepage choices. Header `Demo` is a discreet deep link. Neither card assigns a permanent role or requires a wallet. Both onboarding pages lead to the existing `/verify` console; they do not duplicate an API client.
3. **Scope before execution.** Each journey shows the same illustrative Demo Vault Audit Program, the reviewed local target, and the current authorization limit before linking to the console. This avoids presenting a navigation click as permission to probe external contracts.
4. **Plain capability labels.** Program records, invitations, agent REST/MCP access, finding inbox, signed requests, and Concordium anchoring are identified as planned. The current receipt is private and local; a reproduced result is limited to tested conditions.
5. **Quiet presentation.** The brief's off-white, charcoal, forest-green, and border tokens replace the earlier dark gradients and badges. CSS handles keyboard focus, reduced motion, wrapping, and narrow mobile stacking. No runtime font or component dependency was added.

## Browser evidence and remaining validation

Headless Chrome rendered the homepage at 1440, 1024, 390, and 320 CSS pixels. At all four widths, measured document scroll width did not exceed the viewport. The two cards were equally wide at desktop sizes and stacked at mobile sizes. Eight successive Tab presses reached the skip link, brand, four navigation links, and both role cards with visible focus outlines. Automated tests calculate at least 4.5:1 contrast for core normal-text color pairs. These checks do not substitute for a manual screen-reader review or user interviews.

Captured from the actual local server: [desktop](screenshots/issue-34/home-1440.png), [laptop](screenshots/issue-34/home-1024.png), [mobile](screenshots/issue-34/home-390.png), [narrow mobile](screenshots/issue-34/home-320.png), [team mobile](screenshots/issue-34/teams-390.png), and [researcher mobile](screenshots/issue-34/researchers-390.png). The existing `/verify` console retains its Issue #8 styling and execution logic; this redesign does not change its API or result rendering.

Actual user interviews or usability tests with DeFi teams and researchers are still needed to validate whether the wording and sequence meet their expectations.

## Issue #39 revision: product overview and opportunities (2026-11-11)

The owner requested a broader product introduction, separate role detail, an opportunities view, and light/dark themes. This revision uses observed public patterns as inspiration, not as evidence of VeriPoC user preferences.

| Reference | Observed pattern | VeriPoC adaptation |
| --- | --- | --- |
| [Orchid](https://orchid.ai/) and its [gallery capture](https://www.a1.gallery/websites/minimal-landing) | A concise general-purpose hero, one Get Started action, an illustrative product panel, and airy feature sections on a light blue/white palette. | The homepage now states VeriPoC's purpose first and shows a labeled three-part product illustration. A single Get started action opens the role paths. The indigo-blue theme is our own accessible interpretation, with an optional dark variant; no Orchid assets or page copy are reused. |
| [Cantina opportunities](https://cantina.xyz/opportunities) | A separate browse page groups audit opportunities with status, category, search/filter controls, and explicit program cards. | The researcher path uses a directory-card layout with status and scope. Only the reviewed Demo Vault card is actionable; other cards are conspicuously unavailable previews. We omit reward figures, customer logos, and live-program claims. |

Role-specific pages explain the complete journey in steps. The code panel displays excerpts from `contracts/evm/FixtureVault.sol` and `test/TrustedVaultWorker.t.sol`; its vulnerable/patched control changes **displayed source only**. It does not call the API or simulate a successful run. Scroll position updates the active explanation without taking focus or submitting a job. On narrow screens each step includes its own readable code excerpt.

The team path includes a local draft preview for a future bug bounty program. The form sends no request, stores nothing, and clears on reload. Program ownership, authorization, invitations, persistence, and external target support remain Issue #35 work. The actual `/verify` route still accepts only reviewed local fixtures and still requires a real authenticated backend result.

The theme switch stores only a display preference. Light and dark colors use semantic tokens so the homepage, role pages, and existing verifier can share a coherent palette. The interface keeps visible focus and reduced-motion behavior. Automated layout and interaction checks are useful but do not replace research interviews or manual screen-reader testing.

Current browser captures: [desktop homepage](screenshots/issue-39-revision/home-1440.png), [320 px homepage](screenshots/issue-39-revision/home-320.png), [dark homepage](screenshots/issue-39-revision/home-dark.png), [opportunities](screenshots/issue-39-revision/opportunities.png), [researcher code workflow](screenshots/issue-39-revision/researcher-workflow.png), and [unsaved team draft](screenshots/issue-39-revision/draft-preview.png). The revised Playwright suite passed all 11 checks at 1440, 1024, 390, and 320 CSS pixels, including navigation, keyboard controls, no horizontal overflow, no-JavaScript fallback, unavailable-backend state, and core text contrast in both themes.

## Owner's visual reference revision

The owner supplied screenshots of Orchid's centered, editorial hero, alternating feature sections, and spacious link-column footer, plus Cantina's compact opportunity rows. These are visual and structural references, not proof that those patterns have been validated with VeriPoC users. The latest homepage uses a centered serif headline and one Get started action, followed by three full-width vertical sections. Each section pairs product-specific copy with a labeled local fixture, checked-in code excerpt, or verification-flow diagram. None of the panels displays a fabricated run result.

The opportunity index is separate from the demo detail. It shows every listing at once because there are only three entries; fake search filters, counts, payout figures, and customer identities would add noise or misleading claims. Only the reviewed local vault opens a detail route. The detail explains scope, researcher investigation and submission, then links to the existing authenticated verifier. The team draft remains unsaved and does not authorize a program. Header navigation is limited to How it works and Opportunities, while the footer supplies discoverable secondary routes and an explicit local-demo status.

Actual screenshots from the revised browser suite: [desktop landing](screenshots/issue-39-editorial/home-1440.png), [320 px landing](screenshots/issue-39-editorial/home-320.png), [dark landing](screenshots/issue-39-editorial/home-dark.png), [opportunities index](screenshots/issue-39-editorial/opportunities.png), and [demo detail](screenshots/issue-39-editorial/demo-detail.png).

## Owner's Charcoal and opportunity-list revision

The owner supplied a [Recur](https://recur.build/) screenshot showing charcoal and paper modes, oversized sans typography, coral emphasis, a compact editor preview, and high-contrast controls. VeriPoC now adapts those broad visual patterns to its own copy, logo, reviewed Solidity fixture, and security boundaries. The Paper/Charcoal switch stores only a preference. The homepage editor compares formatted source excerpts from the checked-in vulnerable and patched vaults; it never runs a job or displays a verdict.

The owner also supplied a [Cantina opportunities](https://cantina.xyz/opportunities) screenshot with a numeric summary, category tabs, search, two-tier program rows, and a promotional panel between listings. Our four summary values are explicitly labeled **local demo figures**: $0 payouts, one known fixture vulnerability, one runnable local program, and two reviewed variants. They do not describe platform traction. All three directory entries appear by default; Bounties, Competitions, and Ended correctly show empty states. The promotional panel links to an unsaved team draft. Only the demo vault row opens a detail page; preview rows have no authorization or submission path.

The current demo detail embeds the existing authenticated verifier after the researcher guidance. The direct `/verify` route remains available, but is absent from the main navigation and footer. The old `/teams/start` and `/researchers/start` journey pages have been removed. Both verification entry points use the same console and unchanged API contracts.

Browser captures from this revision: [Paper homepage](screenshots/issue-39-charcoal/home-1440.png), [Charcoal homepage](screenshots/issue-39-charcoal/home-dark.png), [320 px homepage](screenshots/issue-39-charcoal/home-320.png), [opportunity directory](screenshots/issue-39-charcoal/opportunities.png), [320 px directory](screenshots/issue-39-charcoal/opportunities-320.png), and [demo detail with embedded verifier](screenshots/issue-39-charcoal/demo-detail.png).

The latest review removes the redundant introduction above the three scroll sections and gives the researcher and verification visuals compact icon sequences. The summary figures keep their local-demo accessibility label while dropping the visible snapshot banner and secondary explanations. The vault detail now follows an opportunity-page hierarchy: program identity, instructions, authorized scope, a concise verification summary, then the unchanged live console. The displayed $0 payout and local-fixture boundaries remain explicit. Earlier screenshots above document prior iterations and do not represent the final layout.

## Team draft brief revision

The [Cantina Morpho bounty](https://cantina.xyz/bounties/35a5f0a1-2ffd-432c-8f3b-77d169add8c3) separates instructions from target scope and also states severity, eligibility, prohibited actions, and disclosure rules. [Code4rena's submission guidance](https://docs.code4rena.com/competitions/submission-guidelines) asks researchers for location, impact, reproduction steps, and a runnable Solidity PoC where required. Those are useful field categories; VeriPoC uses original wording and asks additionally for immutable revision, invariants, agent setup, and tool limits so a researcher-owned agent can prepare an evidence-backed claim within a bounded program.

The draft page presents one section at a time and continuously displays entered fields in an unsaved preview. Field explanations appear when the adjacent `*` help button is hovered or focused. The preview is held in component memory and clears on reload. API/MCP agent access and signed requests are future work; the draft does not grant an external agent a live audit permission or run one automatically.
