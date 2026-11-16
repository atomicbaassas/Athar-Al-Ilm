# Athar Al 'Ilm — UI/UX app review (2026-11-17)

Screens found: 48 Vue views (23 public/learner routes + 25 admin). Screens checked (source + live public): home, learn, login, library, quran, header. Screens not reached: dashboard + all `/admin/*` (auth required). Spacing: capture script obtained; full 390/1440/1728 geometry pass not completed for every route (noted below).

Findings: **1 critical, 4 serious, 3 moderate, 2 minor.**

## Critical

1. **Home hero opacity flicker (1→0→1 after GSAP loads)** — `rule/motion-never-delays-frequent-tasks` + honest-loading / animation frame budget  
   - Screens: `/`  
   - Evidence: Measured — Playwright opacity samples `first=1`, `min=0`, `flips=1` at 390 and 1440.  
   - Cause: SSG paints hero visible; async `gsap.from()` then snaps to `opacity: 0`.  
   - Fix applied: `html.js-home-motion` pre-hide + `fromTo`; failsafe removes class if GSAP fails.
   - Local remeasure: first opacity 0 → last 1, **snapDown=0** (was 1 on prod).  
   - Files: `frontend/src/views/HomeView.vue`, `frontend/src/assets/main.css`

## Serious

2. **Vague / competing CTAs on home** — comprehension (15s + screenshot)  
   - Screens: `/` + header  
   - Evidence: Derived — `check-comprehension`: 4 actions; `Get Started` hid outcome.  
   - Fix applied (EN/AR/SW): header `nav.getStarted` → “Create free account” (matches `/register`).  
   - Remaining: home still has primary + secondary + final CTAs (marketing density). Not cut further without a product call.

3. **Scroll-triggered `gsap.from` on already-visible sections** — `rule/motion-never-delays-frequent-tasks`  
   - Screens: `/` stats, bento, `[data-reveal]`  
   - Evidence: Derived from `HomeView.vue` ScrollTrigger `onEnter` + Measured hero pattern.  
   - Fix applied: same CSS pre-hide for those selectors + `fromTo`.

4. **Hover scale/transform without `@media (hover: hover)`** — `rule/hover-needs-keyboard-equivalent` / visual-design hover  
   - Screens: library cards, curriculum cards, home CTAs (`hover:-translate-y`, `group-hover:scale`)  
   - Evidence: Derived — Tailwind hover utilities on touch devices.  
   - Fix: not applied this pass (wide surface). Prefer `motion-safe` + fine-pointer media.

5. **Admin route-transition fade** — `rule/reduced-motion-keeps-content` (partial)  
   - Screens: `/admin/*`  
   - Evidence: Derived — `AdminLayout.vue` `.fade-enter-from { opacity: 0 }`. Global reduce-motion CSS shortens transitions; verify content never stuck hidden.  
   - Not measured live (auth).

## Moderate

6. **Light learner pages vs dark home** — visual inconsistency  
   - Screens: `/` vs `/learn`, `/library`, `/login`  
   - Evidence: Measured — home dark hero; others light `headerH=88`, transparent body.  
   - Intentional marketing vs app chrome; header theme (`home-light`) only on home → flash when navigating away while `home-light` class may linger.  
   - Check: clear `home-light` when leaving home (not fixed this pass).

7. **Global `p { font-size: 1.125rem }`** — typography inconsistency  
   - Evidence: Derived — `main.css`; fights compact UI copy in admin/forms.  
   - Prior audit noted related contrast bugs; keep scoped.

8. **Soft-404 on `/curriculum`** — comprehension / routing  
   - Evidence: Measured earlier — SPA “Page not found” title while HTTP 200. Real path is `/learn`.  
   - Fix: optional redirect alias (not applied).

## Minor

9. Dead CSS `.reveal` / `useScrollReveal` vs GSAP `[data-reveal]` dual systems — Derived.  
10. Footer hardcodes EN labels (`Start Learning`, …) while hero uses i18n — Derived.

## Checks not run

| Screen / check | Why |
|---|---|
| All `/admin/*`, `/dashboard` | Auth / account required |
| `inspect-spacing` completed | Capture script ready; full multi-width state upload skipped this pass (hero flicker prioritized) |
| `review-dashboard-structure` | Admin dashboard not reached |
| Native phone surface | Web responsive only |

## Worst five (for the person)

1. Home GSAP flicker (fixed locally; redeploy to clear prod)  
2. Competing / vague CTAs (header label fixed; home density remains)  
3. Scroll-reveal snap risk (mitigated with pre-hide)  
4. Touch hover lifts  
5. Home-theme class leak across routes

## Follow-up (2026-11-17 skipped items)

- Touch hover: `tailwind.config.js` `future.hoverOnlyWhenSupported = true`
- `/curriculum` → `/learn` redirect
- Home secondary CTA demoted to text link; comprehension re-check **Pass**
- Spacing capture (home/learn/login @390/1440/1728): completed for geometry; decorative hero glow bleeds off-screen on 390 (intentional); learn view toggles ~44×36 (near 44px)
- Auth admin screens still not reached
