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
