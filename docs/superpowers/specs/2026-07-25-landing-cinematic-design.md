# TrainFlow cinematic landing — design

**Date:** 2026-07-25  
**Scope:** Public marketing page (`/`) only. App chrome and `--primary` teal unchanged.

## Identity

“Apple designed a performance platform for modern personal trainers.”

- ~60% minimal product presentation (light bands)
- ~40% athletic energy (dark cinematic bands, restrained motion)
- Not a gym / influencer / bodybuilding brand

## Accent (shared with app)

Landing uses the same theme tokens as the dashboard (`--primary` teal, `background`, `card`, `muted`, `border`). Light/dark follow the global theme toggle — no separate marketing palette.

## Section map

1. Nav (transparent → solid on scroll)
2. Hero (dark)
3. Product reveal (light)
4. Problem (light)
5. How it works (light)
6. Core features (alternating)
7. Before / after (light)
8. Workout builder showcase (dark)
9. Export showcase (light)
10. Pricing (light)
11. FAQ (light, 5–6 practical Qs)
12. Beta / early access (light)
13. Final CTA (dark)
14. Footer

No invented testimonials or usage statistics.

## Motion

CSS + IntersectionObserver. `prefers-reduced-motion` disables transforms/parallax. No Framer Motion.

## Auth

CTAs: `/sign-up`, `/sign-in`. No Clerk/API changes.
