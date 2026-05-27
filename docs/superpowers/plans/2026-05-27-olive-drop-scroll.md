# Olive-Drop Scroll Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage hero stack with a minimal cream hero, and add a scroll-driven animation that drops an olive from a hand at the top of the page down onto a block of feta cheese in a new landing band.

**Architecture:** The olive is a fixed-position element rendered separately from the hand image. Its vertical position is interpolated from scroll progress between two anchor points: the hand's fingertip in the hero, and the feta block's top surface in the new landing band. A single rAF-throttled scroll handler updates a CSS custom property; CSS interpolates the position. An `IntersectionObserver` activates/deactivates the handler when the user is inside the drop zone. A bounce-on-arrival CSS keyframe fires when scroll progress crosses 95%. `prefers-reduced-motion` short-circuits the JS entirely and shows the olive resting on the feta as a static composition.

**Tech Stack:** Astro 5 (static output), vanilla CSS (no preprocessor), vanilla JS module (IIFE in `public/script.js`). No build step for CSS/JS. No test framework. Verification = `npm run build` + `npm run dev` + visual inspection in browser.

**Reference spec:** `docs/superpowers/specs/2026-05-27-olive-drop-scroll-design.md`

---

## File Structure

**Files modified:**
- `src/pages/index.astro` — homepage; replaces hero markup, inserts two new sections, removes one image from Story section
- `public/styles.css` — adds/replaces hero rules; adds rules for two new sections, olive tracker, bounce, reduced-motion
- `public/script.js` — adds one new module (the olive-drop scroll handler) inside the existing IIFE

**Files created:**
- `public/public/olive.png` — standalone Kalamata olive on transparent background (Higgsfield-generated)
- `public/public/feta-block.png` — block of feta cheese on transparent background (Higgsfield-generated)

**Files NOT touched in this work (left on disk, references removed from `index.astro`):**
- `public/public/hero-overlay-kf1.png`, `kf2.png`, `kf3.png`
- `public/public/hero-queen-anne-greek-v3.png`, `hero-queen-anne-greek-poster.jpg`
- `public/public/video/new_hero.mp4`, `hero_video.mp4`, `hero_video_poster.jpg`

---

## Task 1: Generate the olive and feta assets

**Files:**
- Create: `public/public/olive.png`
- Create: `public/public/feta-block.png`

This task produces the two new image assets. Generation is interactive (Higgsfield), with user approval required for the final results.

- [ ] **Step 1: Generate the olive image**

Use the `higgsfield-generate` skill with `gpt_image_2`. Prompt:

> "Single Kalamata olive, dark purple-black with a hint of green sheen, slight matte finish, photographed in clean studio light from a slight 3/4 top-down angle. Transparent background, no shadow, no surface, no surrounding props. Editorial product-shot quality. Square aspect ratio. The olive should fill ~60% of the frame, centered."

Acceptance criteria: olive is centered, transparent background, looks like a single Kalamata olive (oval, dark, slight highlight), no shadow that would conflict with placement on cream backgrounds.

- [ ] **Step 2: Save the olive to `public/public/olive.png`**

Confirm with user before saving. If the user rejects, iterate with adjusted prompt.

- [ ] **Step 3: Generate the feta image**

Use the `higgsfield-generate` skill with `gpt_image_2`. Prompt:

> "A clean block of Greek feta cheese, roughly cube-shaped with slightly crumbly edges, soft white with subtle off-white tones, photographed from a slight 3/4 top-down angle so the top surface is visible. Transparent background, no shadow, no plate, no surrounding props. Studio lighting, editorial product-shot quality. Square aspect ratio. The feta block should fill ~60% of the frame, centered."

Acceptance criteria: feta is centered, transparent background, top surface clearly visible at the angle (so a falling olive can visually land on it), reads as feta at small sizes.

- [ ] **Step 4: Save the feta to `public/public/feta-block.png`**

Confirm with user before saving. Iterate if rejected.

- [ ] **Step 5: Commit the assets**

```bash
git add public/public/olive.png public/public/feta-block.png
git commit -m "Add olive and feta-block image assets for homepage drop animation"
```

---

## Task 2: Replace the homepage hero with the cream layout

**Files:**
- Modify: `src/pages/index.astro` (the `<section class="hero">` block, lines ~10–87)
- Modify: `public/styles.css` (hero rules, lines ~290–448)

Erases the bg video, the three overlay frames, the right-side video frame, and the dark gradient wash. Replaces with a cream-background hero that keeps the title/buttons/meta and adds the `hand_olive.png` on the right side.

- [ ] **Step 1: Replace the `<section class="hero">` block in `src/pages/index.astro`**

Find the existing `<section class="hero">…</section>` block (starts at line ~11, ends at line ~87, just before `<!-- A Taste of Greece — auto-scrolling dish marquee -->`).

Replace the entire block with:

```astro
<!-- Hero (cream / minimal) -->
<section class="hero hero-cream">
  <div class="hero-content container">
    <div class="hero-text">
      <span class="eyebrow">Coastal · Mediterranean · Family-run</span>
      <h1 class="hero-title">
        <span class="title-line">KALA</span>
        <span class="title-line title-italic">Greek <span class="amp">&amp;</span> More</span>
      </h1>
      <p class="hero-sub">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus quis pellentesque
        magna. Praesent ut sollicitudin ligula, vitae laoreet justo. Curabitur dapibus laoreet
        eros.
      </p>
      <div class="hero-buttons">
        <a href="/order" class="btn btn-primary btn-lg">
          Order Online
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
        <a href="/reservations" class="btn btn-ghost btn-lg">Make a Reservation</a>
      </div>

      <div class="hero-meta">
        <div class="meta-item">
          <span class="meta-label">Open today</span>
          <span class="meta-value">11:00a – 10:00p</span>
        </div>
        <span class="meta-divider"></span>
        <div class="meta-item">
          <span class="meta-label">Find us</span>
          <span class="meta-value">1500 Queen Anne Ave N</span>
        </div>
      </div>
    </div>

    <div class="hero-hand-wrap" aria-hidden="true">
      <img src="/public/hand_olive.png" alt="" class="hero-hand" loading="eager" />
    </div>
  </div>

  <a href="#feta-landing" class="scroll-cue" aria-label="Scroll to see the olive land">
    <span>scroll</span>
    <svg viewBox="0 0 14 24" aria-hidden="true">
      <rect x="0.5" y="0.5" width="13" height="23" rx="6.5" fill="none" stroke="currentColor"/>
      <circle cx="7" cy="7" r="2" fill="currentColor"/>
    </svg>
  </a>
</section>
```

Key differences from the old block:
- No `<div class="hero-media">`, `<video class="hero-bg-video">`, `<div class="hero-gradient">`, `<div class="hero-illustration">`, `<div class="hero-video-frame">`
- New `<div class="hero-hand-wrap">` containing `hand_olive.png` (right column)
- `<section>` gets new `hero-cream` class for cream styling
- `.scroll-cue` `href` now points to `#feta-landing` (the new section, added later)
- `.eyebrow` lost the `eyebrow-light` modifier (was for dark bg; now we're on cream)

- [ ] **Step 2: Update hero CSS rules in `public/styles.css`**

Find the existing block of rules starting at `.hero {` (around line 290) and continuing through `.hero-video-frame` rules (around line 448).

Replace the section from `.hero {` through `@keyframes heroZoom { … }` (around line 358) with:

```css
.hero {
  position: relative;
  min-height: 86vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 96px 0 80px;
  isolation: isolate;
  overflow: hidden;
  text-align: center;
}
.hero-cream {
  background: var(--cream);
  color: var(--charcoal);
}
.hero-content {
  position: relative;
  max-width: 1240px;
  width: 100%;
  z-index: 2;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(24px, 4vw, 64px);
  align-items: center;
}
.hero-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  max-width: 560px;
}
.hero-text > * { animation: rise .9s var(--ease) both; }
.hero-text .eyebrow { animation-delay: .05s; }
.hero-title         { animation-delay: .15s; }
.hero-sub           { animation-delay: .3s; }
.hero-buttons       { animation-delay: .45s; }
.hero-meta          { animation-delay: .6s; }

/* Hero hand — right column */
.hero-hand-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rise 1s var(--ease) both;
  animation-delay: .35s;
}
.hero-hand {
  width: clamp(220px, 28vw, 360px);
  height: auto;
  display: block;
  /* hand-olive.png composition has the olive at the fingertip;
     we center the hand image inside the right column so the olive
     sits roughly at the horizontal center of the viewport */
  margin-left: -16%;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Then DELETE (do not just comment out) these rules later in the file:

- `.hero-media { ... }` and `.hero-media img, .hero-media .hero-bg-video { ... }` and `.hero-media img { animation: heroZoom ... }` (around lines 304–316)
- The entire `.hero-illustration { ... }`, `.hero-ill-frame { ... }`, `.ill-frame-1/2/3` rules (around lines 317–342)
- `@keyframes heroIllSlideshow { ... }` (around lines 344–350)
- `@media (max-width: 900px) { .hero-illustration { display: none; } }` (around lines 352–354)
- `@keyframes heroZoom { ... }` (around lines 355–358)
- `.hero-gradient { ... }` (around lines 359–379)
- `.hero-video-frame { ... }`, `.hero-video-frame::after { ... }`, `.hero-video-frame video { ... }` (around lines 408–438)
- `.hero-content { grid-template-columns: 1fr; }` override and `.hero-video-frame { display: none; }` override (around lines 441–442)

Also update the responsive override around line 444–448 to:

```css
@media (max-width: 900px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-text {
    align-items: center;
    text-align: center;
  }
  .hero-hand-wrap {
    order: -1; /* hand above text on mobile */
  }
  .hero-hand {
    width: clamp(160px, 50vw, 240px);
    margin-left: 0;
  }
}
```

Find this rule further down in the file (used by the `parallax` JS code, around line 2741):

```css
.hero-bg-video,
.hero-illustration img,
```

If it appears, delete those two selectors from the rule (the rest of the rule may still apply to other classes — be careful to only remove these two lines).

- [ ] **Step 3: Disable the hero parallax in `public/script.js`**

Find the `onScroll` function around line 25. Find this block:

```js
if (heroMedia && !prefersReducedMotion) {
  const offset = Math.min(y * 0.22, 180);
  heroMedia.style.transform = `translate3d(0, ${offset}px, 0)`;
}
```

Delete it entirely (along with the `const heroMedia = $('.hero-media');` line near the top of the IIFE around line 22 — there's no `.hero-media` element anymore).

- [ ] **Step 4: Build and visually verify**

Run:

```bash
npm run build
```

Expected: build succeeds with no errors. (Astro will warn about missing assets only at runtime — broken `<source>` references won't fail the build.)

Then:

```bash
npm run dev
```

Open `http://localhost:4321/` in a browser. Expected:
- Cream/parchment background fills the hero
- Title, subtitle, buttons, and meta row appear on the LEFT, all using existing styles, animating in via the rise keyframe
- Hand image appears on the RIGHT, with the olive at roughly the horizontal center of the page
- No background video, no overlay PNGs, no right-side video frame
- Scroll cue indicator visible at the bottom of the hero
- On mobile width (e.g., 375px), hand appears above text, both centered

Stop the dev server (Ctrl+C) when verification is done.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro public/styles.css public/script.js
git commit -m "Replace homepage hero with cream/minimal layout

Erase the bg video, three keyframe overlay images, right-side
video frame, and dark gradient. Replace with a cream-background
hero featuring the hand image on the right (positioned so the
olive sits at the horizontal center of the viewport). All hero
text/CTAs/meta are unchanged."
```

---

## Task 3: Add the Transition Band section

**Files:**
- Modify: `src/pages/index.astro` (insert new section between `</section>` of hero and `<!-- A Taste of Greece -->`)
- Modify: `public/styles.css` (append new rules)

A short cream-background section with an editorial line of text. Sits between the hero and the (still-to-be-added) feta landing band.

- [ ] **Step 1: Insert the transition band markup in `src/pages/index.astro`**

After the closing `</section>` of the hero block (the one with `.scroll-cue` inside), and before the existing `<!-- A Taste of Greece — auto-scrolling dish marquee -->` comment, insert:

```astro
<!-- Transition Band — olive falls through this -->
<section class="transition-band">
  <div class="container">
    <p class="transition-line">From hand, to table, to you.</p>
  </div>
  <div class="meander-divider meander-divider-bottom" aria-hidden="true"></div>
</section>
```

- [ ] **Step 2: Append the transition band CSS to `public/styles.css`**

At the end of `public/styles.css` (or near the existing hero rules — your choice), add:

```css
/* ──────────────────────────────────────────────
   Olive-drop scroll choreography
   ────────────────────────────────────────────── */

.transition-band {
  position: relative;
  background: var(--cream);
  min-height: 65vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8vh 0 12vh;
}
.transition-line {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  color: var(--charcoal);
  opacity: .78;
  text-align: center;
  max-width: 32ch;
  margin: 0 auto;
  line-height: 1.25;
}
.meander-divider-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}

@media (max-width: 700px) {
  .transition-band { min-height: 50vh; padding: 6vh 0 8vh; }
}
```

Note: `.meander-divider` already exists in the codebase (used between sections elsewhere); `.meander-divider-bottom` is a positioning modifier.

- [ ] **Step 3: Build and verify**

Run:

```bash
npm run build
```

Expected: build succeeds.

```bash
npm run dev
```

Open homepage. Expected:
- After the hero, scrolling reveals a cream-background section with the italic line "From hand, to table, to you." centered vertically and horizontally
- Greek-key meander pattern at the bottom of this section
- No visible seam between hero and transition band (same cream color)
- On mobile, the section is shorter (~50vh)

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro public/styles.css
git commit -m "Add transition band section to homepage

Cream-background section between the hero and the upcoming
feta landing band. Holds one editorial italic line and a
meander divider at the bottom."
```

---

## Task 4: Add the Feta Landing section (static, olive at rest)

**Files:**
- Modify: `src/pages/index.astro` (insert new section after the transition band)
- Modify: `public/styles.css` (append new rules)

The feta landing band, with the olive shown at its final rest position on top of the feta. The olive here is the **landed copy** (a normal `<img>` inside the band); the **falling copy** is added as a separate fixed element in Task 6.

- [ ] **Step 1: Insert the feta landing markup in `src/pages/index.astro`**

Directly after the closing `</section>` of the transition band, and before the existing `<!-- A Taste of Greece ... -->` comment, insert:

```astro
<!-- Feta Landing — olive lands here -->
<section class="feta-landing" id="feta-landing">
  <div class="meander-divider meander-divider-top" aria-hidden="true"></div>
  <div class="container feta-landing-inner">
    <div class="feta-stage" aria-hidden="true">
      <img src="/public/olive.png" alt="" class="olive olive-landed" />
      <img src="/public/feta-block.png" alt="" class="feta-block" />
    </div>
    <div class="feta-caption">
      <span class="eyebrow">Made by hand</span>
      <p class="feta-line">Greek staples. Simply, carefully prepared.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append the feta landing CSS to `public/styles.css`**

After the transition-band rules, add:

```css
.feta-landing {
  position: relative;
  background: var(--cream);
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6vh 0;
}
.meander-divider-top {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}
.feta-landing-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1.5rem, 3vw, 2.5rem);
}
.feta-stage {
  position: relative;
  width: clamp(220px, 28vw, 340px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.feta-block {
  width: 100%;
  height: auto;
  display: block;
}
.olive-landed {
  position: absolute;
  /* sits slightly indented on the top surface of the feta */
  top: 18%;
  left: 50%;
  width: 14%;
  height: auto;
  transform: translateX(-50%);
}
.feta-caption {
  text-align: center;
  max-width: 42ch;
}
.feta-line {
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.2rem, 2.2vw, 1.6rem);
  color: var(--charcoal);
  opacity: .82;
  margin: .25rem 0 0;
}

@media (max-width: 700px) {
  .feta-landing { min-height: 70vh; }
  .feta-stage { width: clamp(180px, 60vw, 240px); }
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Open homepage. Expected:
- After the transition band, the feta landing band appears with cream background
- Greek-key meander at the TOP of the section
- Feta block image centered, with the olive resting on its top surface (slightly indented)
- Caption below: "Made by hand" eyebrow + "Greek staples. Simply, carefully prepared." italic line
- On mobile, section is shorter, feta is smaller, layout still works
- Existing dish marquee picks up after this section

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro public/styles.css
git commit -m "Add feta landing section with static olive composition

Cream-background section with a Greek-key meander at the top.
Holds the feta-block image with the olive at its final rest
position on top, plus a small editorial caption below.

The falling olive (separate fixed element) is added next."
```

---

## Task 5: Remove the olive hand from the Story section

**Files:**
- Modify: `src/pages/index.astro` (Story section, around lines 304–316)
- Modify: `public/styles.css` (`.story-visual` and `.hand-olive` rules, around lines 899–968)

The hand-olive image is gone from the Story section (it's now in the hero). The wine hand stays in place. The `.vis-glow` and `.key-ribbon` stay.

- [ ] **Step 1: Remove the hand-olive line from `src/pages/index.astro`**

Find this line (inside the `<div class="story-visual">` block, around line 307):

```astro
<img src="/public/hand_olive.png" alt="" class="hand hand-olive" loading="lazy" />
```

Delete it entirely. Leave the surrounding `<img class="hand hand-wine">`, `<div class="vis-glow">`, and `<svg class="key-ribbon">` intact.

- [ ] **Step 2: Remove `.hand-olive` CSS rules in `public/styles.css`**

Find the `.hand-olive { ... }` rule (around line 945). Delete it. Leave `.hand`, `.hand-wine`, `.vis-glow`, `.key-ribbon`, and surrounding rules intact.

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Scroll to the Our Story section. Expected:
- Story section text is unchanged
- `.story-visual` panel shows only the wine hand (bottom-right) + the radial glow + the meander ribbon
- No broken layout (the wine hand was always positioned independently of the olive hand)
- No console errors

If the visual composition looks unbalanced (e.g., the wine hand looks adrift without its olive counterpart), adjust `.hand-wine` positioning to something more centered:

```css
.hand-wine {
  bottom: 8%;   /* was 2% */
  right: 0;     /* was -6% */
}
```

Only apply this adjustment if needed — visually verify first.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro public/styles.css
git commit -m "Remove hand-olive from Story section

The olive hand now lives in the hero. The Story section keeps
the wine hand, the radial glow, and the meander ribbon."
```

---

## Task 6: Add the fixed olive-tracker element (no JS yet)

**Files:**
- Modify: `src/pages/index.astro` (add tracker element after the Base opening or just after the hero)
- Modify: `public/styles.css` (append tracker rules)

The falling olive is a separate `<img>` rendered in a `position: fixed` container, pinned to the horizontal center of the viewport. In this task we add the element and its base styles, but it stays hidden — the JS that drives its vertical position is added in Task 7.

- [ ] **Step 1: Add the tracker element to `src/pages/index.astro`**

At the very top of the homepage's main content (the first child inside the `<Base ...>` slot, before `<!-- Hero -->`), insert:

```astro
<!-- Olive-drop scroll tracker (the falling olive; falls from hero to feta landing) -->
<div class="olive-tracker" aria-hidden="true" data-olive-tracker>
  <img src="/public/olive.png" alt="" class="olive olive-falling" />
</div>
```

- [ ] **Step 2: Append the tracker CSS to `public/styles.css`**

After the feta-landing rules, add:

```css
/* The falling-olive element. Fixed-positioned, pinned to horizontal center.
   Its vertical position is driven by the JS scroll handler in script.js,
   which writes a px value to --olive-y on the body. CSS interpolates here. */
.olive-tracker {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translate3d(-50%, var(--olive-y, -200px), 0);
  pointer-events: none;
  z-index: 5;
  /* Hidden by default; JS adds .is-active when in the drop zone */
  opacity: 0;
  transition: opacity .25s ease-out;
  will-change: transform;
}
.olive-tracker.is-active { opacity: 1; }

.olive-falling {
  width: clamp(36px, 4vw, 56px);
  height: auto;
  display: block;
}

@media (max-width: 700px) {
  .olive-falling { width: clamp(28px, 7vw, 40px); }
}

@media (prefers-reduced-motion: reduce) {
  /* Hide the falling olive entirely; the .olive-landed in the feta band
     remains as the static end state. */
  .olive-tracker { display: none; }
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Expected:
- Homepage looks identical to before (Task 5 end state)
- No new visual element appears (the tracker is opacity 0 with no `.is-active` class yet)
- In DevTools Elements panel, `<div class="olive-tracker" data-olive-tracker>` is present in the DOM near the top of the main content
- No console errors
- Page can still be scrolled normally

This task adds structure without behavior; the next task wires up the JS that brings it to life.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro public/styles.css
git commit -m "Add olive-tracker fixed element and base styles

The tracker is hidden until the user scrolls into the drop zone,
at which point JS (added next) toggles .is-active and writes the
vertical position to --olive-y."
```

---

## Task 7: Wire the scroll handler — drop zone math and position interpolation

**Files:**
- Modify: `public/script.js` (append a new module inside the existing IIFE)

This is the core animation logic. Adds an `IntersectionObserver` on a sentinel that spans the drop zone (from the hero hand to the feta landing), plus a `requestAnimationFrame`-throttled scroll handler that writes scroll progress to a CSS custom property as a pixel `top` offset.

- [ ] **Step 1: Add the olive-drop module to `public/script.js`**

Find a logical insertion point inside the existing IIFE in `public/script.js`. The cleanest place is right after the `onScroll` block (around line 46) and before the mobile-menu block (line 48). Or alternatively, at the very end of the IIFE (just before the closing `})();` around line 529).

Insert this complete module:

```js
/* ─────────────────── Homepage olive-drop scroll animation ─────────────────── */
const tracker = $('[data-olive-tracker]');
if (tracker && !prefersReducedMotion) {
  const heroHand   = $('.hero-hand');
  const fetaStage  = $('.feta-stage');
  const landedOlive = $('.olive-landed');

  if (heroHand && fetaStage && landedOlive) {
    // Anchors. Recomputed on layout changes.
    let startY = 0;   // viewport-relative Y where the olive starts (hand fingertip)
    let endY   = 0;   // viewport-relative Y where the olive lands on the feta
    let zoneTop = 0;     // document-absolute top of drop zone
    let zoneBottom = 0;  // document-absolute bottom of drop zone
    let scheduled = false;

    const measure = () => {
      // Hand fingertip ≈ horizontal-center-of-hand, ~38% from top of hand image.
      const handRect = heroHand.getBoundingClientRect();
      const handFingertipPageY = handRect.top + window.scrollY + handRect.height * 0.38;

      // Olive lands on top edge of feta block (matches .olive-landed top: 18%).
      const landedRect = landedOlive.getBoundingClientRect();
      const landingPageY = landedRect.top + window.scrollY + landedRect.height / 2;

      zoneTop    = handFingertipPageY - window.innerHeight * 0.05;
      zoneBottom = landingPageY;

      startY = handFingertipPageY;
      endY   = landingPageY;
    };

    const update = () => {
      scheduled = false;
      const y = window.scrollY;
      // progress: 0 when scroll is at zoneTop (or above), 1 when scroll past zoneBottom
      let progress = (y - zoneTop) / (zoneBottom - zoneTop);
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      // Olive's viewport-Y is interpolated: at progress=0 it's at the hand fingertip,
      // at progress=1 it's at the landing point. Subtract scrollY to convert
      // page-space to viewport-space (since the tracker is position: fixed).
      const oliveY = startY + (endY - startY) * progress - y;
      tracker.style.setProperty('--olive-y', `${oliveY}px`);

      // Activate (fade in) while inside the zone
      const inZone = y > zoneTop - window.innerHeight * 0.05 && y < zoneBottom + 100;
      tracker.classList.toggle('is-active', inZone);

      // Hide the static landed copy until the falling olive has finished,
      // so we don't see two olives at once.
      landedOlive.style.opacity = progress >= 1 ? '1' : '0';
    };

    const onScrollOlive = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };

    // Measure once initial layout settles; remeasure on resize.
    const remeasure = () => {
      measure();
      update();
    };
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(remeasure);
      ro.observe(document.body);
    } else {
      window.addEventListener('resize', remeasure);
    }

    window.addEventListener('scroll', onScrollOlive, { passive: true });
    window.addEventListener('load', remeasure);
    // Initial run (in case load already fired or images are cached)
    remeasure();
  }
}
```

Notes on placement:
- The `$` and `$$` helpers, and `prefersReducedMotion`, are already defined at the top of the IIFE — no need to redeclare
- This module is self-contained; it does nothing if `data-olive-tracker` is absent (e.g., on subpages)

- [ ] **Step 2: Hide the static landed olive initially via CSS**

In `public/styles.css`, find the `.olive-landed` rule (added in Task 4) and add `opacity: 0;` to it so the landed copy is hidden until JS toggles it on:

```css
.olive-landed {
  position: absolute;
  top: 18%;
  left: 50%;
  width: 14%;
  height: auto;
  transform: translateX(-50%);
  opacity: 0;          /* shown by JS once falling olive arrives */
  transition: opacity .25s ease-out;
}
```

Then add a reduced-motion override: in the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of the tracker rules, ADD a rule for the landed olive so it's visible immediately for reduced-motion users:

```css
@media (prefers-reduced-motion: reduce) {
  .olive-tracker { display: none; }
  .olive-landed { opacity: 1; }
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Open the homepage. Expected behavior:
- At the top of the page, no olive is visible (the falling olive's opacity is 0 because we're above the drop zone; the landed olive is also opacity 0)
- As you start scrolling, around the hero/transition boundary, the falling olive fades in and starts moving downward at the same rate as the page (so it appears to stay in the same vertical region of the viewport while scrolling reveals more page below)
- As you continue scrolling, the falling olive's `--olive-y` value shifts so it tracks downward through the page
- When the feta landing band scrolls into view and you reach the bottom of the drop zone, the falling olive lines up with the top of the feta block, and the static `.olive-landed` fades in (the falling olive is still there at opacity 1)
- Scrolling back up reverses everything cleanly
- On a wide viewport (1440px+), the olive should pass through the horizontal center of the page
- No jank, no jitter on rapid scroll

If the olive's resting position visually overlaps the feta block edge wrong (too high, too low, off-center horizontally), adjust the `0.38` multiplier in `measure()` (controls fingertip position) and/or the `0.18` `top` in `.olive-landed` (controls landing position).

- [ ] **Step 4: Commit**

```bash
git add public/script.js public/styles.css
git commit -m "Wire scroll-driven olive tracker

Computes drop-zone anchors from the hero hand and the feta
landing positions, then writes a viewport-space vertical offset
to --olive-y on each rAF-throttled scroll event. The static
.olive-landed fades in once the falling olive reaches the bottom
of the zone, giving the impression that the olive came to rest."
```

---

## Task 8: Add the bounce-on-arrival animation

**Files:**
- Modify: `public/styles.css` (add bounce keyframe and `.is-landed` modifier)
- Modify: `public/script.js` (add a class toggle when progress crosses 95%)

A small ~250ms bounce when the olive arrives at the feta.

- [ ] **Step 1: Add bounce keyframe and modifier to `public/styles.css`**

In the olive-tracker section of the stylesheet (alongside `.olive-tracker.is-active`), add:

```css
/* Bounce-on-arrival: a small drop-and-settle motion overlaid on the
   tracker's translated position. Triggered by adding .is-landed via JS. */
.olive-tracker.is-landed .olive-falling {
  animation: oliveBounce .42s cubic-bezier(.55, .06, .68, .19) 1;
}
@keyframes oliveBounce {
  0%   { transform: translateY(0); }
  35%  { transform: translateY(8px); }
  60%  { transform: translateY(-3px); }
  85%  { transform: translateY(2px); }
  100% { transform: translateY(0); }
}
```

- [ ] **Step 2: Toggle `.is-landed` from JS based on scroll progress**

In `public/script.js`, find the `update()` function added in Task 7. After the `progress` clamping and before/after the `tracker.style.setProperty('--olive-y', ...)` line, add the bounce-trigger logic:

```js
const update = () => {
  scheduled = false;
  const y = window.scrollY;
  let progress = (y - zoneTop) / (zoneBottom - zoneTop);
  if (progress < 0) progress = 0;
  if (progress > 1) progress = 1;

  const oliveY = startY + (endY - startY) * progress - y;
  tracker.style.setProperty('--olive-y', `${oliveY}px`);

  const inZone = y > zoneTop - window.innerHeight * 0.05 && y < zoneBottom + 100;
  tracker.classList.toggle('is-active', inZone);

  // Bounce-on-arrival: add .is-landed when progress first crosses .95;
  // remove it when progress drops back below .92, so re-scrolling up and
  // back down re-fires the bounce. Hysteresis prevents flicker.
  if (progress >= 0.95) {
    tracker.classList.add('is-landed');
  } else if (progress < 0.92) {
    tracker.classList.remove('is-landed');
  }

  landedOlive.style.opacity = progress >= 1 ? '1' : '0';
};
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Open homepage, scroll down to the feta landing band. Expected:
- As the olive arrives at the feta's surface (around 95% scroll progress through the drop zone), the falling olive plays a quick ~420ms bounce (drops ~8px, returns, settles)
- Bounce only plays once per arrival; it doesn't loop while you stay scrolled past the band
- Scroll back up past ~92% progress, then back down past ~95% — the bounce plays again
- No jank or jitter; bounce is smooth

- [ ] **Step 4: Commit**

```bash
git add public/script.js public/styles.css
git commit -m "Add bounce-on-arrival when olive lands on the feta

When scroll progress crosses 95% of the drop zone, the tracker
gets an .is-landed class that triggers a brief drop/settle
keyframe on the olive. Hysteresis (re-arms below 92%) lets the
bounce replay if the user re-enters the landing."
```

---

## Task 9: Verify the reduced-motion fallback

**Files:**
- No file changes; verification only

The CSS we wrote already includes `@media (prefers-reduced-motion: reduce) { .olive-tracker { display: none; } .olive-landed { opacity: 1; } }`. The JS `if (tracker && !prefersReducedMotion)` guard already prevents the handler from attaching. This task is the explicit verification step.

- [ ] **Step 1: Build and run**

```bash
npm run build && npm run dev
```

- [ ] **Step 2: Simulate reduced motion in Chrome DevTools**

1. Open Chrome DevTools
2. Open the Command Menu (Ctrl+Shift+P / Cmd+Shift+P)
3. Type "Emulate CSS prefers-reduced-motion" and select "Emulate CSS prefers-reduced-motion: reduce"
4. Reload the homepage

Expected:
- No falling olive appears anywhere as you scroll — the `.olive-tracker` is `display: none`
- The static `.olive-landed` is visible immediately on the feta (no waiting for scroll progress)
- All other animations on the page (rise-in keyframes, hover effects, etc.) should NOT have been disabled by this work (we only added reduced-motion overrides for the new elements; existing rules are untouched)
- Page is fully usable; the editorial composition still reads as "hand at top → olive sitting on feta below"

- [ ] **Step 3: Toggle back and confirm full animation returns**

Turn the emulation off (re-open the command palette, "Emulate CSS prefers-reduced-motion: No emulation"). Reload. Verify the full scroll-driven animation works again.

- [ ] **Step 4: No commit needed (verification only)**

If you discovered an issue during verification, fix it inline as part of this task and commit:

```bash
git commit -m "Fix reduced-motion fallback: <description>"
```

Otherwise, proceed to the next task.

---

## Task 10: Mobile tuning pass

**Files:**
- Modify: `public/styles.css` (potentially)
- Modify: `public/script.js` (potentially — only if the math needs adjustment)

The CSS we wrote includes mobile breakpoints (`@media (max-width: 700px)` for `.transition-band`, `.feta-landing`, `.olive-falling`). This task is a real-world verification pass on actual narrow viewports.

- [ ] **Step 1: Run the site and verify on iPhone-class width**

```bash
npm run dev
```

Open DevTools, switch to Responsive Design Mode, set viewport to 375x812 (iPhone X size). Reload.

Expected:
- Hero shows the hand image on top, text/buttons centered below
- Olive is at the horizontal center of the viewport (it's still pinned to `left: 50%`, so this is automatic)
- Falling olive is smaller (~28–40px) per the mobile CSS
- Transition band is shorter (~50vh)
- Feta landing band is shorter (~70vh); feta image is smaller
- Scroll the page slowly — olive falls smoothly, lands on the feta, bounces

Test also at 768x1024 (iPad portrait): hand stays in the right column on this width (breakpoint is at 900px); same animation works.

- [ ] **Step 2: Identify and fix any issues**

Common issues you might find and how to fix them:
- **Olive lands off the feta horizontally:** The hand image's horizontal position on mobile pushes the olive's start-X off-center. Since the tracker is fixed at `left: 50%`, the start-X is always centered — but the *visual expectation* is that the olive starts at the hand's fingertip. On mobile, the hand is centered above the text, so the olive start aligns naturally. If you see a problem, adjust `.hero-hand { margin-left: 0; }` inside the `@media (max-width: 900px)` block (already in the CSS from Task 2 — should already be 0).
- **Olive moves too fast/slow:** The drop zone is from hand-fingertip-page-Y to feta-landing-page-Y. On mobile this distance is shorter, so the same scroll feels faster. If it feels jarring, increase `min-height` on `.transition-band` for mobile (e.g., 60vh instead of 50vh).
- **Landed olive misaligned on the feta:** Adjust `.olive-landed`'s `top: 18%` and `width: 14%` percentages for mobile inside the `@media (max-width: 700px)` block:

```css
@media (max-width: 700px) {
  .feta-landing { min-height: 70vh; }
  .feta-stage { width: clamp(180px, 60vw, 240px); }
  .olive-landed { top: 16%; width: 18%; }
}
```

- [ ] **Step 3: Commit if any changes were made**

```bash
git add public/styles.css
git commit -m "Tune olive-drop animation for mobile viewports"
```

If no changes were needed, no commit is required.

---

## Task 11: Final smoke test and cleanup pass

**Files:**
- No file changes; verification only

A complete end-to-end manual smoke test.

- [ ] **Step 1: Build and serve the production output**

```bash
npm run build && npm run preview
```

Open the URL Astro reports (usually `http://localhost:4321/` or similar). Browsing the *built* site (not the dev server) catches build-only issues.

- [ ] **Step 2: Run the checklist**

Test each item; note any that fail and fix before declaring complete.

- [ ] Homepage loads with cream hero, hand on right (desktop) / above text (mobile)
- [ ] No background video, no overlay PNGs, no right-side video frame anywhere on homepage
- [ ] Scrolling from the top reveals the falling olive within the drop zone
- [ ] Olive falls smoothly through the transition band
- [ ] Olive lands on the feta with a small bounce
- [ ] After landing, the static `.olive-landed` is visible (no double-olive flicker)
- [ ] Scrolling back up reverses cleanly
- [ ] No console errors anywhere on the homepage
- [ ] Hero `.scroll-cue` link still scrolls to `#feta-landing`
- [ ] Story section shows the wine hand only — no olive hand, no broken layout
- [ ] Dish marquee, callout, menu preview, and Story sections are untouched
- [ ] Navigation to `/menu`, `/our-story`, `/contact`, `/reservations`, `/order` works (these subpages are unchanged)
- [ ] On each subpage, the page-header background image still loads (we did NOT touch subpage backgrounds — verifies we didn't break them by accident)
- [ ] Reduced-motion emulation: falling olive is hidden, landed olive shown statically (re-verify from Task 9)
- [ ] Mobile (375px viewport): all of the above works at small width

- [ ] **Step 3: Visually confirm with the user**

Tell the user: "Final QA pass complete. The olive-drop animation is live on the homepage. Take a look at `http://localhost:4321/` and confirm everything reads right before we wrap up."

Wait for user confirmation. Iterate on any feedback before declaring complete.

- [ ] **Step 4: No additional commits required**

All commits were made at the end of their respective tasks. If smoke-test issues required fixes, those are committed inline with the task that needed them.

---

## Out of scope (do NOT do in this work)

- Migrating menu / our-story / contact / reservations / order to Astro
- Deleting the old hero asset files from `public/public/` (they're only referenced from the old hero markup, which is gone; cleanup is a separate task)
- Subpage page-header backgrounds (`page-bg-*.png`) — explicitly preserved
- Generated-feta quality fallback (SVG Plan B) — only if Higgsfield output is unusable, raise it with the user; do not attempt SVG without approval
- Final editorial copy for transition-band line and feta caption — placeholder copy committed; can be refined separately
