# VeriPoC frontend — Next.js, Tailwind and interactive storytelling
**Decision:** 2026-11-11. Supersedes the earlier *"don't migrate from plain HTML"* guidance in UI_DESIGN_SYSTEM.md because the product owner explicitly requested Next.js + Tailwind.

## Architecture decision
Use a conventional, maintainable **Next.js App Router** application in `apps/web`:
- **TypeScript** with strict type checking; **Next.js App Router** (latest stable version compatible with Node and project dependencies, pinned in lockfile).
- **Tailwind CSS v4** plus CSS variables for `docs/UI_DESIGN_SYSTEM.md` tokens.
- **Geist** from `next/font/google`, fallback system sans, and `Geist_Mono` only for hashes and debugging.
- **shadcn/ui** pieces (Button, Card, Tabs, Accordion) via documented installations as needed; **Radix** for accessible primitives, **lucide-react** for icons. Avoid introducing entire dashboards/ui kits, component generators and redundant packages.
- **Motion for React** for small scroll-triggered and interactive transitions with reduced-motion support; no GSAP/Lenis/smooth-scroll override by default.
- **Playwright** for 1440/1024/390/320 screenshot and keyboard E2E smoke, React Testing Library/Vitest or existing test tooling for components. Enforce real API-backend integration separately.
- Keep current Node `apps/api`, trusted Foundry sandbox, receipt schema, and agent-card bytes intact. Existing API still handles strict `POST /v1/verify-poc` and `GET /v1/jobs/:id`.

### Routing
```
apps/web/
  app/
    layout.tsx           # fonts, metadata, logo, global shell
    page.tsx             # two equal choices
    teams/start/page.tsx # DeFi team journey
    researchers/start/page.tsx
    verify/page.tsx      # preserve real PoC console
    demo/page.tsx        # interactive walkthrough (no fake real runs)
    icon.svg / favicon.ico
  components/
    brand/logo.tsx
    landing/role-card.tsx
    landing/interactive-workflow.tsx
    verification/verification-console.tsx
    verification/evidence-panel.tsx
    ui/...
  lib/
    api-client.ts
    types.ts
  public/
    brand/veripoc-mark.svg
    brand/veripoc-app-icon.svg
  app/globals.css
  tailwind/postcss setup, tsconfig, eslint config and package.json
```
Use canonical Next App Router file conventions; adjust to current stable create-next-app defaults instead of blindly following outdated starter instructions.

### Deployment and trust boundary
**Do not run Docker/Foundry inside Vercel serverless functions.** The Node API and isolated Foundry worker remain in a separately deployed controlled Docker-capable environment. The Next app may be hosted on Vercel; use an explicit HTTPS API origin and server-side proxy when necessary. The client may hold only non-privileged demo tokens, never worker secrets, privileged Concordium credentials, or persistent localStorage wallet secrets. Next rewrites to loopback allowed only in local development; deployed endpoints must be strongly authenticated, scoped, HTTPS-only, rate-limited, and secret-safe.

The current `apps/api/server.mjs` hosts old static HTML routes in addition to API endpoints. After migration, the Next app owns `/`, `/teams/start`, `/researchers/start`, `/verify`, `/demo`. API owns `/v1/*` and the Agent Card read-only route. Transition carefully with temporary compatibility where needed; never serve competing public site entrypoints.

### Logo usage
Use the checked-in vector assets created in PR #37 at `apps/web/logo.svg` and `apps/web/app-icon.svg`; migrate them to `apps/web/public/brand/`.
- Header: logo **mark only**, no visible fallback 'V' or 'VeriPoC' text lockup. The home link must retain accessible name `aria-label="VeriPoC home"`.
- Browser icon, touch icon and social previews derived from the square app icon; external source/favicons not required.
- No glowing, gradient, 3D, or external generative art in shipping brand icon.
- Keep entire logo clear at 24–44px, use aspect ratio 1:1 and no unnecessary logo animation.
- Accessibility: visible mark in header, app name in document title and accessibility label.

### Visual design
Warm near-white `#F8F9F7`, white panels, ink `#171F1B`, forest green `#276C55`, thin `#E0E5E0` borders, muted `#68716C`. Avoid dark cyberterminal look in any user-facing screen. Hero copy <= 2 lines; cards should communicate purpose without text walls.

### Non-negotiable migration gates
1. Inspect open PR #37 first. Preserve its two-role homepage, logo asset update, and current routing behavior; avoid rebuilding from scratch without reason.
2. Existing root `npm` scripts and API/worker/receipt tests continue working; specify workspace scripts to run web and API independently. Pin versions and lockfile.
3. Keep the real verification job flow intact: Bearer auth, nonce-like idempotency key, fixed fixture allowlist, queue state, real execution evidence and digest. Do not hardcode positive verdicts or mock proof routes.
4. Security and privacy: on-chain identity/anchors only when actual transactions exist; no automatic bounty decisions, no arbitrary uploaded code execution.
5. `npm run build` for Next production passes; typecheck/lint and unit tests pass; Playwright demo flows and keyboard/reduced-motion paths checked or limitations documented.
6. Avoid accidental outbound requests during local tests. `next/font` can fetch fonts at build time; provide robust system font fallback for offline builds.
7. One issue/one PR; migrate architecture in Issue #38 **after owner explicitly approves next work**. The more advanced interactive story is Issue #39.
 
## References
- https://nextjs.org/docs/app
- https://nextjs.org/docs/app/getting-started/installation
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://nextjs.org/docs/app/getting-started/fonts
- https://motion.dev/docs/react
- https://motion.dev/docs/react-use-scroll
- https://motion.dev/docs/react-use-reduced-motion
