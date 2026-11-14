# Athar Al 'Ilm — Better Design web-asset pack

**Quiet Mihrab** — review-only pack. Does **not** overwrite `frontend/public/` or Contabo.

## Design system

| | |
|---|---|
| Catalog base | **[Atelier](https://better-design.com/design-systems/atelier)** — light, calm, restrained forest-green |
| Why not Evergreen / Neon / Supabase | Evergreen = dark analytics; Neon/Supabase = developer/AI vibes. Buyers are adult Islamic learners seeking trust, not dashboards. |
| Generated project | [Preview (no sign-in)](https://better-design.com/preview/f171c419-444d-4ea1-898b-b5e927e8261f) · id `233a5d0c-36b4-43c7-bff8-e044a7b0d991` |
| Live extract | `https://atharulilm.or.tz` → primary `oklch(0.3231 0.0584 168.33)` ≈ `#0B3D2E`, light theme only, flat material |
| Icons (DS pairing) | Iconoir — for future UI, not required for this mark pack |

**Trade-off accepted:** Atelier calm + brandCss/url from live site. Gain: scholarly quiet + exact brand green. Lose: Evergreen’s dark emerald drama. Affects: learners and teachers scanning favicons/OG. Fits: Ahlul Athar gravitas without AI-purple clichés.

## Principles applied

From Better Design `get-ui-principle`:

- **Color:** Logo keeps brand hue (not UI “action color” confusion). Few hues, many shades; green-tinted neutrals (`#F4F7F5`, `#5A6F66`). No purple gradients.
- **Typography:** Avoid Inter/Roboto defaults. EN lockups use Literata/Baskerville; AR uses Noto Naskh Arabic / Al Nile with proper shaping. Short hierarchy (title + one support line).

## Concept

**Quiet Mihrab** — one architectural niche (stroke) + one knowledge node (dot). Reads as mihrab / portal of ilm; works at 16px; ~50% negative space.

## vs `logos/athar-variants/` (01–05)

| | `athar-variants` | This pack |
|---|---|---|
| Method | logo-generator Phase 2 (6 geometric pattern variants) | Better Design DS + principles → one cohesive SOTA lockup |
| Marks | Chain, radiance, kitab, seal, monogram | Single Quiet Mihrab system |
| Wordmarks | None | EN + AR |
| Aesthetic | Exploratory geometric set | Editorial Atelier calm, production-ready cohesion |

## Files

```
logos/athar-better-design/
  mark.svg                 master vector
  favicon.svg
  favicon-32.png
  favicon-64.png
  mark-512.png
  mark-1024.png
  icon-180.png             Apple touch
  icon-192.png             PWA any
  icon-app-512.png         white mark on #0B3D2E
  icon-maskable-512.png    safer padding
  icon-app.svg / icon-maskable.svg
  wordmark-en.svg / .png
  wordmark-ar.svg / .png
  og.svg / og-1200x630.png
  index.html               compare gallery
  README.md
```

Open `index.html` in a browser to review (~30 seconds).

## Promote into `frontend/public/` (only after you choose this pack)

```bash
ROOT="/Users/swalehbaassas/AIO Devs/.worktrees/Athar-Al-Ilm/feat-tadabbur"
V="$ROOT/logos/athar-better-design"
PUB="$ROOT/frontend/public"

cp "$V/favicon.svg"            "$PUB/favicon.svg"
cp "$V/icon-180.png"           "$PUB/icons/icon-180.png"
cp "$V/icon-192.png"           "$PUB/icons/icon-192.png"
cp "$V/icon-app-512.png"       "$PUB/icons/icon-512.png"
cp "$V/icon-maskable-512.png"  "$PUB/icons/icon-maskable-512.png"
cp "$V/og-1200x630.png"        "$PUB/logo-rounded.png"
# Optional: keep a dedicated OG path if you add og:image later
# cp "$V/og-1200x630.png"      "$PUB/og.png"
```

Do **not** run these until you explicitly pick this pack over a variant in `athar-variants`.

## Not done

- No commit / push / Contabo deploy
- Vue frontend not switched to the Better Design React kit (wrong stack; tokens used for brand direction only)
- Live `frontend/public/` icons untouched
