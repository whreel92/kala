# Olive-drop scroll animation — homepage

**Date:** 2026-05-27
**Status:** Approved design, ready for implementation plan
**Surface:** Homepage (`src/pages/index.astro`) only

## Summary

The homepage gets a scroll-driven animation: a hand at the top of the hero appears to be dropping an olive; as the user scrolls down the page, the olive falls vertically through the page and lands on a block of feta cheese in a dedicated landing section. The existing homepage hero stack (background video, three keyframe Greek-poster overlays, and the right-side video-in-frame) is erased and replaced with a minimal cream/parchment hero that puts the hand and the animation at the center of the experience.

The animation is contained to the top portion of the homepage: the olive falls through the hero, a short transition band, and lands in a new feta landing band. The rest of the homepage (dish marquee, lunch callout, menu preview, story section) is untouched.

## Goals

- Give the homepage a distinctive, brand-aligned scroll moment that rewards the user for scrolling
- Reinforce the Greek / made-by-hand identity through the hand → olive → feta narrative
- Strip the homepage hero of its heavy photographic/video imagery in favor of a quieter, more editorial composition
- Maintain accessibility (works with `prefers-reduced-motion`) and parity on mobile

## Non-goals

- No changes to subpage hero/page-header background images (`page-bg-*.png` stays)
- No changes to the dish marquee, callout, menu preview, or story section content
- No splash/particle effects on landing — the bounce-on-arrival is the entire reward
- No migration of the other HTML pages (menu, our-story, contact, reservations, order) — those remain on the existing HTML structure
- No cleanup/deletion of orphaned image files from disk in this work; references are removed but files stay for recovery (cleanup is a separate task)

## Page structure

Homepage section order changes from:

```
Hero → Dish Marquee → Meander Divider → Lunch Callout → Menu Preview → Story
```

to:

```
Hero (new) → Transition Band (new) → Feta Landing (new) → Dish Marquee → Meander Divider → Lunch Callout → Menu Preview → Story
```

Two new sections — Transition Band and Feta Landing — are inserted between the hero and the dish marquee. Everything from the dish marquee down is unchanged.

## Section designs

### Hero (new)

**Erased:**
- `<video class="hero-bg-video">` element (background video and poster image)
- `<div class="hero-illustration">` and its three child images: `hero-overlay-kf1.png`, `hero-overlay-kf2.png`, `hero-overlay-kf3.png`
- `<div class="hero-video-frame">` and its inner video element on the right side

**Kept (unchanged):**
- Eyebrow text ("Coastal · Mediterranean · Family-run")
- Title block ("KALA / Greek & More")
- Hero subtitle paragraph
- Two CTA buttons (Order Online, Make a Reservation)
- Meta row (hours, address)
- `.scroll-cue` indicator at the bottom of the section (now functionally meaningful — scrolling triggers the drop)

**Added:**
- Solid cream/parchment background using existing brand color tokens in `public/styles.css`
- A single `hand_olive.png` positioned on the right side of the hero, sized and offset such that the olive at the hand's fingertip sits at the **horizontal center of the viewport**. This center alignment is critical: the olive falls straight down on a single vertical line through the page, so the hand's olive position and the feta's center must align horizontally.

### Transition Band (new)

A new section that gives the olive vertical space to fall through after the hero scrolls off.

- Cream background, continuous with the hero (no visible seam)
- One short editorial line of text, centered, set in Cormorant italic to match the existing Story / Callout heading style. Placeholder copy: *"From hand, to table, to you."* — final copy to be picked during implementation
- A faint Greek-key meander running horizontally at the bottom of the band as a soft delineator into the landing band
- Height: ~60–70vh on desktop, ~50vh on mobile (enough scroll distance to feel the fall, not so tall it stalls)

The olive falls *past* the text as the user scrolls — the text stays put, the olive moves.

### Feta Landing (new)

A new section, ~85–100vh on desktop, where the olive lands.

- Cream background, continuous
- A Greek-key meander at the **top** of the band, mirroring the one at the bottom of the transition band — together they frame the landing zone
- Centered horizontally: the feta block image (`feta-block.png`), sized roughly 280–360px wide on desktop
- Feta positioned roughly at the vertical center of the band, leaving headroom above (for the olive's final approach) and a small caption below
- Small caption beneath the feta: an eyebrow + one editorial line. Placeholder copy: *"Greek staples. Made by hand."* — final copy to be picked during implementation
- When scroll progress hits ~95% of the drop zone, the olive plays a ~250ms bounce-on-arrival keyframe (drops ~8px, returns, settles)
- Rest position: olive sits at the upper edge of the feta block, slightly indented so it visually "landed there" rather than floating above

After this band, the dish marquee picks up unchanged.

## Animation mechanism

### The olive element

The falling olive is a **single element**, separate from the hand image. It lives in a fixed-position container that overlays the page:

- `position: fixed`
- `left: 50%; transform: translateX(-50%)` — pinned to horizontal center
- `pointer-events: none` — does not intercept clicks
- `z-index: 5` — floats above content
- Sized ~40–60px tall on desktop, scales down on mobile

### Visibility and scroll mapping

The olive is only visible while the user is scrolled into the **drop zone** — a vertical range that begins at the hand's fingertip position in the hero and ends at the feta's surface in the landing band.

- Above the start of the drop zone: olive hidden (`display: none`)
- Within the drop zone: olive's vertical position is a linear interpolation of scroll progress. 0% scroll-into-zone = top of zone (at the hand fingertip); 100% scroll-into-zone = resting on the feta
- Below the end of the drop zone: olive remains rendered at its rest position on top of the feta (so re-scrolling up keeps the visual continuity)

### The bounce-on-arrival

When scroll progress crosses ~95% of the drop zone, a CSS class is added to the olive container that triggers a ~250ms bounce keyframe. The class is removed if the user scrolls back up out of the trigger range so the bounce plays again on re-entry.

### Implementation outline (~40 lines of JS)

- A single `IntersectionObserver` watches a sentinel element that spans the drop zone, detecting entry/exit (toggles visibility and the rAF loop)
- A `scroll` event handler throttled with `requestAnimationFrame` computes scroll progress through the drop zone and writes it to a CSS custom property `--olive-progress` (0 → 1) on `document.body`
- CSS reads `--olive-progress` and interpolates the olive's `top` value using `calc()` against the known start and end pixel offsets (stored as separate CSS custom properties set from JS on initial layout and on resize)
- A separate small handler toggles the `.is-landed` class on the olive when progress crosses ~0.95, triggering the bounce

### Why a JS handler rather than native CSS `animation-timeline: scroll()`

Native scroll-driven animations have good browser support in 2026, but the implementation is roughly the same code volume once you account for the bounce trigger, the cross-section drop zone (which spans more than a single element), and resize/layout-recompute logic. The JS version is easier to debug, tune, and reason about. Performance cost is trivial: one rAF-throttled scroll handler.

### Reduced-motion fallback

A `@media (prefers-reduced-motion: reduce)` block short-circuits the animation:
- The scroll handler is never attached (feature-detected at module init)
- The olive is rendered statically at its rest position on top of the feta
- The hand still appears in the hero
- No bounce, no scroll-tied motion — the page shows a clean still composition of hand + (no falling olive in midair) → feta-with-olive at the landing band

### Mobile

Mobile gets the full scroll-driven effect. The vertical layout works fine on narrow screens — if anything the fall is more dramatic. Tuning:
- Olive scales down (~30–40px)
- Transition band shortens (~50vh)
- Feta image scales down (~200–240px)

## Assets

| Asset | Source | Notes |
|---|---|---|
| `hand_olive.png` | Exists at `public/public/hand_olive.png` | Reused in the new hero; no edits needed |
| `hand_wine.png` | Exists at `public/public/hand_wine.png` | Remains in the Story section (unchanged) |
| `olive.png` | **To create** | Standalone Kalamata-style olive, transparent background, ~120px source so it scales clean. Generate via Higgsfield (preferred) or extract from `hand_olive.png` |
| `feta-block.png` | **To create** | Studio shot of a block of feta cheese, transparent background, slight top-down 3/4 angle so the olive can "land" on a visible top surface. Generate via Higgsfield, style-matched to existing site (clean, warm, editorial) |

Asset generation happens during implementation (via the `higgsfield-generate` skill), not in this design.

## Files touched

- `src/pages/index.astro`
  - Hero section: erase video/overlays/right-frame; keep title/buttons/meta; add hand image; add olive container; add new bg class
  - Insert Transition Band section
  - Insert Feta Landing section
  - Story section: remove the `<img class="hand hand-olive">` line; keep `<img class="hand hand-wine">`

- `public/styles.css`
  - Add: `.hero-cream`, `.transition-band`, `.feta-landing`, `.olive-tracker`, `.olive-tracker.is-landed`, the bounce keyframe, the reduced-motion overrides
  - Remove or scope-out: `.hero-media`, `.hero-bg-video`, `.hero-illustration`, `.hero-ill-frame`, `.ill-frame-1/2/3`, `.hero-video-frame`, `.hero-gradient` (anything tied to the erased hero elements)
  - Adjust `.story-visual` rules if removing `.hand-olive` leaves layout gaps (likely needs a small touch-up since the wine hand is positioned relative to the olive hand in the current composition)

- `public/script.js`
  - Add the scroll-driven olive module: ~40 lines. Module pattern: feature-detect reduced motion → if reduced, render olive at rest position and return; otherwise wire up the IntersectionObserver + rAF scroll handler

- `public/public/olive.png` — **new asset**
- `public/public/feta-block.png` — **new asset**

Old hero assets are referenced only from the erased markup; the files themselves are left on disk in this work and can be cleaned up in a follow-up.

## Out of scope

- Subpage hero/page-header backgrounds (`page-bg-menu.png`, `page-bg-story.png`, `page-bg-contact.png`, `page-bg-reservations.png`, `page-bg-order.png`) — untouched
- The dish marquee, callout, menu cards, story photos — untouched
- The HTML versions of menu / our-story / contact / reservations / order — not migrated to Astro in this work
- Splash, particle, or shatter effects on landing — explicitly excluded
- Cleanup of orphaned image files from disk

## Accessibility

- `prefers-reduced-motion: reduce`: animation disabled, static end-state shown (see Reduced-motion fallback above)
- The olive is decorative; rendered with `aria-hidden="true"` and an empty `alt` attribute if it's an `<img>`
- The hand image is also decorative; existing `alt=""` retained
- The hero title and CTAs are unchanged — primary content remains keyboard-navigable and screen-reader-friendly
- The new Transition Band and Feta Landing sections include their respective editorial copy as real text (not in images), so screen-reader users still get the editorial moments

## Risks and known unknowns

- The hand's fingertip in `hand_olive.png` may not align perfectly with the viewport's horizontal center after positioning — implementation will need to measure and tune
- Generated feta asset quality is unknown until we run Higgsfield; the design assumes a transparent-background block that reads as feta at small sizes. Plan B is a stylized SVG block if photographic results are weak
- The drop zone spans multiple sections — resize/orientation changes need to recompute start/end pixel offsets. Implementation must handle this (likely a `ResizeObserver` on the drop-zone sentinel)
- The bounce-on-arrival timing is tied to scroll position, not real time. If the user scrolls very slowly through the last 5%, the bounce keyframe still plays at its own clock once triggered. This is the intended behavior

## Open follow-ups (outside this work)

- Final copy for the transition-band line and the feta-landing caption
- Decision on whether to delete the orphaned hero assets from disk (separate cleanup task)
