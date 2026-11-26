# Auditor brand mark

The refreshed mark shows two opposing paths meeting at a small diamond: DeFi teams and independent researchers contribute to one verifiable evidence point. It is a navigation and identity mark, not a security certification badge.

## Current website palette

| Use | Light | Dark |
| --- | --- | --- |
| Page | `#f6f5f2` | `#141414` |
| Primary mark stroke | `#181716` | `#f4f0ed` |
| Evidence accent | `#a84532` | `#ee9077` |
| Square app icon | `#181716` background, warm-white and coral paths | Same high-contrast asset |

The website uses `BrandMark` with semantic CSS variables so the header, footer, and demo fixture mark adapt to the Paper/Charcoal toggle. The public SVG is the light-theme export; the square app icon and Next.js favicon use a fixed charcoal background that works in either browser theme. The source shapes and proportions are identical across exports.

Against the page colors, the primary and accent strokes have calculated contrast ratios of 16.42:1 and 5.41:1 in Paper, and 16.26:1 and 7.80:1 in Charcoal. These ratios describe the painted strokes, not a general accessibility audit of the page.

## Usage

- Header: icon only, 48 px art inside a 48 × 48 px home link. The link carries `aria-label="Auditor home"`; the SVG is hidden from assistive technology to avoid a duplicate name.
- Footer: 38 px mark beside the project name. Directory demo row: 30 px mark. Keep at least 6 px clear space around the painted shape at these sizes.
- Favicon: use the square asset at 16 px or 32 px. Its three simple forms remain distinguishable without text. Do not add a glow, gradient, shield, checkmark, or “audited” implication.
- Use the app's semantic tokens for inline marks. If the palette changes, update the static exports in `apps/web/public/brand`, `apps/web/app/icon.svg`, and the two root SVG copies together.

The old forest-green logo assets have been replaced to match the website's current charcoal and terracotta colors. The Agent Card and verification receipts are unaffected.

## Browser captures

- [Paper desktop](screenshots/issue-46/brand-light-1440.png)
- [Charcoal desktop](screenshots/issue-46/brand-dark-1440.png)
- [Charcoal mobile](screenshots/issue-46/brand-dark-390.png)
