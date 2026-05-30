# POS / Online Ordering UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a customer-facing online ordering UI ("POS" in user parlance) that lets visitors browse the KALA menu, customize items with modifiers, add them to a cart, and walk through a fake checkout that produces a confirmation receipt — all on the existing Astro static site, with no real backend or payment processing.

**Architecture:** A shared Astro component (`PosUi.astro`) provides the markup skeleton — page header, two-column layout (menu grid + sticky cart), detail panel, checkout form, and confirmation screen. Two thin Astro pages (`order-pickup.astro`, `order-delivery.astro`) render the component with a `fulfillment` prop. A single browser-side JavaScript module (`pos.js`) reads a static menu data file (`menu-data.js`), renders the menu, manages the cart in `localStorage`, and orchestrates panel/checkout/confirmation transitions. CSS appended to `public/styles.css` styles the whole thing using existing brand tokens.

**Tech Stack:** Astro 5 (static), vanilla CSS (no preprocessor), vanilla JS module pattern (IIFE on a self-detected hook element). No test framework. Verification = `npm run build` + visual inspection.

**Reference spec:** `docs/superpowers/specs/2026-05-30-pos-online-ordering-design.md`

---

## File Structure

**Files created:**
- `public/menu-data.js` — Static menu data: 9 categories × 44 total items. Exposes `window.KALA_MENU`. Loaded by both order pages before `pos.js`.
- `public/pos.js` — POS interaction module. Self-detects whether to run by looking for `[data-pos-ui]` on the page. ~350 lines.
- `src/components/PosUi.astro` — Shared markup skeleton. Two-column layout, all panels in initial closed/hidden state. Takes `fulfillment` prop ('pickup' or 'delivery').
- `src/pages/order-pickup.astro` — `<Base>` wrapper that renders `<PosUi fulfillment="pickup" />`.
- `src/pages/order-delivery.astro` — Same with `fulfillment="delivery"`.

**Files modified:**
- `src/pages/order.astro` — three card `href` values updated: Pickup → `/order-pickup`, Delivery → `/order-delivery`, Catering → `/contact`.
- `src/layouts/Base.astro` — add a `<script src="/menu-data.js" is:inline></script>` and `<script src="/pos.js" is:inline></script>` near the existing `<script src="/script.js">` so they load on every page; both are no-ops on pages without `[data-pos-ui]`.
- `public/styles.css` — appended block of POS-specific CSS (~600 lines).

---

## Task 1: Menu data file

**Files:**
- Create: `public/menu-data.js`

Static data file consumed by `pos.js`. Mirrors the 44 items in `src/pages/menu.astro`. Items get an `id` (kebab-case), name, integer dollar price, image path (same `/public/<file>` URLs already in menu.astro), short description, and modifiers array (empty for most).

- [ ] **Step 1: Open `src/pages/menu.astro` and inventory all items**

Read the file. For each `<article class="menu-item-card">`, extract:
- The `<h3>` inner text → `name`
- The `<span class="price">` inner text (strip `$`, parse int) → `price`
- The `<img src>` → `image`
- The `<p>` inner text inside `card-body` (the first paragraph below the price) → `description`
- The parent `<section class="menu-category" id="...">`'s `id` → category id (use the same one)

There are 44 items across 9 categories: dips (8), salads (4), gyros (5), souvlaki (4), seafood (3), plates (4), sides (5), desserts (4), wine (7). Verify the counts as you go.

- [ ] **Step 2: Create `public/menu-data.js` with the full data structure**

The file must define a single browser-global `window.KALA_MENU`. Structure:

```js
/* KALA menu data — sourced from src/pages/menu.astro.
   Items render in the POS at /order-pickup and /order-delivery. */

window.KALA_MENU = {
  fulfillment: {
    pickup: {
      label: 'Order for Pickup',
      ready_minutes: 25
    },
    delivery: {
      label: 'Order for Delivery',
      ready_minutes: 45
    }
  },

  categories: [
    {
      id: 'dips',
      name: 'Dips & Spreads',
      blurb: 'Made by hand, served cold.',
      items: [
        {
          id: 'tzatziki',
          name: 'Tzatziki',
          price: 7,
          image: '/public/c243bbfd-cba9-4c8b-b273-3abc24c8f935.png',
          description: 'Creamy yogurt and cucumber with garlic, dill, and olive oil.',
          modifiers: []
        },
        {
          id: 'hummus',
          name: 'Hummus',
          price: 7,
          image: '/public/f60f61a9-fe03-4def-a469-10daef938655.png',
          description: 'Chickpea purée with tahini, lemon, and warm pita.',
          modifiers: []
        },
        // ...continue for all 8 dips
      ]
    },

    {
      id: 'salads',
      name: 'Greek Salads',
      blurb: 'Tomato, cucumber, feta, sea-salt sun.',
      items: [
        // ...4 salad items, each with modifiers below
      ]
    },

    {
      id: 'gyros',
      name: 'Gyros',
      blurb: 'Wrapped in pita with tzatziki and a stack of fries.',
      items: [
        {
          id: 'classic-pork',
          name: 'The Classic Pork',
          price: 13,
          image: '/public/e04b7c58-8d54-487c-9f41-5f660e52bc91.png',
          description: 'Pita, tzatziki, tomato, onion, fries.',
          modifiers: [GYRO_MEAT_MODIFIER]
        },
        // ...4 more gyros, each with modifiers: [GYRO_MEAT_MODIFIER]
      ]
    },

    {
      id: 'souvlaki',
      name: 'Souvlaki',
      blurb: 'Charcoal-grilled skewers.',
      items: [
        // ...4 souvlaki items, each with modifiers: [SOUVLAKI_MEAT_MODIFIER]
      ]
    },

    { id: 'seafood',  name: 'Seafood',     blurb: '...', items: [/* 3 items, modifiers: [] */] },
    { id: 'plates',   name: 'Plates',      blurb: '...', items: [/* 4 items, modifiers: [] */] },
    { id: 'sides',    name: 'Sides',       blurb: '...', items: [/* 5 items, modifiers: [] */] },
    { id: 'desserts', name: 'Desserts',    blurb: '...', items: [/* 4 items, modifiers: [] */] },
    { id: 'wine',     name: 'Wine & Drinks', blurb: '...', items: [/* 7 items, modifiers: [] */] }
  ]
};
```

Define the modifier templates ABOVE the `window.KALA_MENU` assignment so they can be referenced:

```js
const GYRO_MEAT_MODIFIER = {
  id: 'meat',
  name: 'Meat',
  required: true,
  type: 'single',
  options: [
    { id: 'pork',    label: 'Pork',    delta: 0 },
    { id: 'chicken', label: 'Chicken', delta: 0 },
    { id: 'lamb',    label: 'Lamb',    delta: 2 }
  ]
};

const SOUVLAKI_MEAT_MODIFIER = {
  id: 'meat',
  name: 'Meat',
  required: true,
  type: 'single',
  options: [
    { id: 'chicken', label: 'Chicken', delta: 0 },
    { id: 'pork',    label: 'Pork',    delta: 0 },
    { id: 'lamb',    label: 'Lamb',    delta: 2 }
  ]
};

const SALAD_PROTEIN_MODIFIER = {
  id: 'add-protein',
  name: 'Add protein',
  required: false,
  type: 'single',
  options: [
    { id: 'none',             label: 'No thanks',         delta: 0 },
    { id: 'grilled-chicken',  label: 'Grilled chicken',   delta: 5 },
    { id: 'gyro-meat',        label: 'Gyro meat',         delta: 5 }
  ]
};
```

The 4 salad items each carry `modifiers: [SALAD_PROTEIN_MODIFIER]`.

Wrap the whole file in an IIFE if you want, but a plain top-level `window.KALA_MENU = {...}` is fine — the file is loaded as a regular script.

**Important:** descriptions in `menu.astro` are all "Lorem ipsum..." placeholders. Replace them with one short, real-sounding sentence describing the dish. Examples:
- Tzatziki: "Creamy yogurt and cucumber with garlic, dill, and olive oil."
- Hummus: "Chickpea purée with tahini, lemon, and warm pita."
- The Classic Pork: "Pita, tzatziki, tomato, onion, fries."
- Horiatiki: "Tomato, cucumber, red onion, feta, Kalamata olives, oregano."
- Branzino: "Whole grilled, lemon and oregano, served with greens."
Use your judgment for the rest — keep it one short sentence per item.

- [ ] **Step 3: Verify the file by counting items**

Run:

```bash
grep -c "id: '" public/menu-data.js
```

Expected: matches the total item count (44) plus the category count (9) plus modifier ids — should be ≥ 53. If it's much lower, items are missing.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: success. The file isn't yet consumed, so this just verifies no Astro-level issues.

- [ ] **Step 5: Commit**

```bash
git add public/menu-data.js
git commit -m "Add static menu data for POS

Exposes window.KALA_MENU with 9 categories and 44 items mirroring
the visible menu page. Items in Gyros and Souvlaki categories
carry a required meat modifier; salads carry an optional protein
modifier. Other categories have no modifiers."
```

---

## Task 2: Page scaffolds + skeleton component + landing link fixes

**Files:**
- Create: `src/components/PosUi.astro`
- Create: `src/pages/order-pickup.astro`
- Create: `src/pages/order-delivery.astro`
- Modify: `src/pages/order.astro` (three `href` values + add `<script>` for menu-data and pos)
- Modify: `src/layouts/Base.astro` (load menu-data.js and pos.js site-wide so they're available)

Structural-only task: no behavior yet. Just verifies the new pages render with placeholder content where the menu and cart will go.

- [ ] **Step 1: Update `src/layouts/Base.astro` to load menu-data.js and pos.js**

Find the existing script tag at the bottom of `<body>` (around line 200):

```astro
<script src="/script.js" is:inline></script>
```

Add two lines just before it:

```astro
<script src="/menu-data.js" is:inline></script>
<script src="/pos.js" is:inline></script>
<script src="/script.js" is:inline></script>
```

Both new scripts will safely no-op on pages without `[data-pos-ui]`.

- [ ] **Step 2: Create `src/components/PosUi.astro`**

```astro
---
interface Props {
  fulfillment: 'pickup' | 'delivery';
}
const { fulfillment } = Astro.props;
const isPickup = fulfillment === 'pickup';
---

<section
  class="pos-ui"
  data-pos-ui
  data-fulfillment={fulfillment}
>

  <!-- Page header -->
  <div class="pos-header container">
    <span class="eyebrow">{isPickup ? 'Pickup' : 'Delivery'}</span>
    <h1>{isPickup ? 'Order for Pickup' : 'Order for Delivery'}</h1>
    <p class="pos-header-sub">
      {isPickup
        ? 'Ready in about 25 minutes at 1500 Queen Anne Ave N.'
        : 'Delivered in about 45 minutes across Queen Anne.'}
    </p>
  </div>

  <!-- Main two-column layout -->
  <div class="pos-grid container">

    <!-- Menu column (left) -->
    <div class="pos-menu-col">
      <!-- Category jump chips (populated by JS) -->
      <nav class="pos-cats" aria-label="Menu categories">
        <div class="pos-cats-inner" data-pos-cats></div>
      </nav>

      <!-- Menu sections (populated by JS) -->
      <div class="pos-menu" data-pos-menu>
        <!-- pos.js fills this in on mount -->
      </div>
    </div>

    <!-- Cart column (right, sticky on desktop) -->
    <aside class="pos-cart-col" aria-label="Your order">
      <div class="pos-cart" data-pos-cart>
        <header class="pos-cart-head">
          <h2>Your order</h2>
        </header>

        <!-- Empty state -->
        <div class="pos-cart-empty" data-pos-cart-empty>
          <p class="pos-cart-empty-line">Your order is empty.</p>
          <p class="pos-cart-empty-sub">Pick a dish from the menu to start.</p>
        </div>

        <!-- Line items (populated by JS) -->
        <ul class="pos-cart-items" data-pos-cart-items hidden></ul>

        <!-- Footer (subtotal + checkout button) -->
        <footer class="pos-cart-foot" data-pos-cart-foot hidden>
          <div class="pos-cart-subtotal">
            <span>Subtotal</span>
            <span data-pos-cart-subtotal>$0</span>
          </div>
          <button type="button" class="btn btn-primary btn-lg pos-checkout-btn" data-pos-checkout-open>
            Proceed to checkout
          </button>
        </footer>
      </div>

      <!-- Checkout form (hidden until "Proceed to checkout") -->
      <div class="pos-checkout" data-pos-checkout hidden>
        <!-- Filled in by Task 7 -->
      </div>
    </aside>
  </div>

  <!-- Item detail panel (hidden) -->
  <div class="pos-detail" data-pos-detail hidden role="dialog" aria-modal="true" aria-label="Customize item">
    <!-- Filled in by Task 5 -->
  </div>

  <!-- Confirmation screen (hidden) -->
  <div class="pos-confirm" data-pos-confirm hidden>
    <!-- Filled in by Task 8 -->
  </div>

  <!-- Mobile sticky cart bar (hidden on desktop) -->
  <button type="button" class="pos-mobile-bar" data-pos-mobile-bar hidden>
    <span class="pos-mobile-bar-count">Cart</span>
    <span class="pos-mobile-bar-arrow">›</span>
  </button>
</section>
```

- [ ] **Step 3: Create `src/pages/order-pickup.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import PosUi from '../components/PosUi.astro';
---
<Base
  title="Order for Pickup — KALA Greek and More"
  description="Order online for pickup at KALA Greek and More — gyros, souvlaki, salads, and Greek classics."
  current="/order"
>
  <PosUi fulfillment="pickup" />
</Base>
```

- [ ] **Step 4: Create `src/pages/order-delivery.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import PosUi from '../components/PosUi.astro';
---
<Base
  title="Order for Delivery — KALA Greek and More"
  description="Order online for delivery from KALA Greek and More — gyros, souvlaki, salads, and Greek classics."
  current="/order"
>
  <PosUi fulfillment="delivery" />
</Base>
```

- [ ] **Step 5: Update `src/pages/order.astro` — fix the three card hrefs**

Find the three `href="#"` and one `href="contact.html"` in the three `<article class="order-card">` blocks. Update:

```astro
<!-- Pickup card -->
<a href="/order-pickup" class="btn btn-primary btn-sm">
  Start Pickup Order
  ...
</a>

<!-- Delivery card -->
<a href="/order-delivery" class="btn btn-primary btn-sm">
  Choose Platform
  ...
</a>

<!-- Catering card -->
<a href="/contact" class="btn btn-primary btn-sm">
  Plan an Event
  ...
</a>
```

Don't change the button label text, the SVG, or anything else. Just the `href` values.

Optionally update the Delivery button label from "Choose Platform" to "Start Delivery Order" since we're now offering native delivery — your call; the spec doesn't require it. **For this task, leave the labels as-is** ("Start Pickup Order", "Choose Platform", "Plan an Event"). Labels can be a separate copy pass.

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: 8 pages built (was 6 — now also order-pickup and order-delivery).

The new pages will render with the page header, the (empty) category nav, the (empty) menu container, the cart's empty-state message, and (hidden) detail/checkout/confirm panels. Nothing renders below the empty cart yet because no CSS has been added — sections will appear stacked/unstyled.

- [ ] **Step 7: Commit**

```bash
git add src/components/PosUi.astro src/pages/order-pickup.astro src/pages/order-delivery.astro src/pages/order.astro src/layouts/Base.astro
git commit -m "Scaffold POS pages and wire /order landing buttons

Adds PosUi.astro skeleton component and two thin page wrappers
(order-pickup, order-delivery). Updates the three /order landing
card hrefs to route to the new pages (and Catering to /contact).
Base layout now loads menu-data.js and pos.js site-wide; both
are no-ops on pages without [data-pos-ui].

Pages render but have no styling and no JS-driven content yet."
```

---

## Task 3: POS CSS scaffolding — layout, header, category bar

**Files:**
- Modify: `public/styles.css` (append a new block at end)

CSS for the page header, two-column grid, category chip bar with sticky/scroll-spy state, and base typography for the POS surfaces. Does NOT yet style the menu cards, cart line items, detail panel, checkout, confirmation, or mobile responsive — those come in later tasks alongside their JS.

- [ ] **Step 1: Append to `public/styles.css`**

At the end of the file (after the last existing rule), append:

```css
/* ──────────────────────────────────────────────
   POS / Online ordering UI
   ────────────────────────────────────────────── */

.pos-ui {
  background: var(--cream);
  min-height: 70vh;
}

.pos-header {
  padding: clamp(40px, 6vw, 80px) 0 clamp(28px, 4vw, 40px);
  text-align: center;
}
.pos-header h1 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(40px, 6vw, 64px);
  margin: 8px 0 14px;
  color: var(--charcoal);
}
.pos-header-sub {
  color: var(--slate);
  font-size: clamp(14px, 1.6vw, 17px);
  max-width: 50ch;
  margin: 0 auto;
}

/* Two-column grid */
.pos-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
  gap: clamp(24px, 3vw, 48px);
  padding-bottom: clamp(60px, 8vw, 100px);
  align-items: start;
}
.pos-menu-col { min-width: 0; }
.pos-cart-col {
  position: sticky;
  top: 88px;             /* below the persistent site nav */
  align-self: start;
  max-height: calc(100vh - 110px);
  overflow: hidden;     /* scroll happens inside .pos-cart */
}

/* Category chip bar (sticky inside menu column) */
.pos-cats {
  position: sticky;
  top: 64px;
  z-index: 4;
  background: var(--cream);
  margin: 0 -8px;
  padding: 8px;
  border-bottom: 1px solid rgba(34,37,46,.08);
}
.pos-cats-inner {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.pos-cats-inner::-webkit-scrollbar { display: none; }
.pos-cat-chip {
  flex: 0 0 auto;
  background: var(--white);
  border: 1px solid rgba(34,37,46,.12);
  color: var(--charcoal);
  padding: 8px 16px;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: .02em;
  cursor: pointer;
  transition: background .2s var(--ease), color .2s var(--ease), border-color .2s var(--ease);
  text-decoration: none;
}
.pos-cat-chip:hover {
  border-color: var(--blue-primary);
  color: var(--blue-primary);
}
.pos-cat-chip.is-active {
  background: var(--blue-primary);
  color: var(--white);
  border-color: var(--blue-primary);
}

/* Menu sections */
.pos-menu {
  padding-top: 24px;
}
.pos-cat-section {
  padding: 24px 0 32px;
  scroll-margin-top: 140px;   /* so anchor scroll lands below sticky chips */
}
.pos-cat-section-head {
  margin: 0 0 18px;
}
.pos-cat-section-head h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(28px, 3.5vw, 38px);
  color: var(--charcoal);
  margin: 0 0 4px;
}
.pos-cat-section-head p {
  color: var(--slate);
  margin: 0;
  font-size: 14.5px;
}

/* Empty cart state */
.pos-cart {
  background: var(--white);
  border: 1px solid rgba(34,37,46,.08);
  border-radius: 14px;
  padding: 22px;
  box-shadow: var(--shadow-soft);
  max-height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
}
.pos-cart-head h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  margin: 0 0 14px;
  color: var(--charcoal);
}
.pos-cart-empty {
  background: var(--cream);
  border: 1px dashed rgba(34,37,46,.18);
  border-radius: 10px;
  padding: 28px 18px;
  text-align: center;
}
.pos-cart-empty-line {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 18px;
  color: var(--charcoal);
  margin: 0 0 4px;
}
.pos-cart-empty-sub {
  color: var(--slate);
  font-size: 13.5px;
  margin: 0;
}

/* Single-column collapse */
@media (max-width: 900px) {
  .pos-grid {
    grid-template-columns: 1fr;
  }
  .pos-cart-col {
    display: none;          /* mobile uses bottom bar + sheet — added in Task 9 */
  }
  .pos-cats { top: 60px; }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Spot-check the structure**

Open `dist/order-pickup.html` and grep for the data hooks to confirm presence:

```bash
grep -c "data-pos" dist/order-pickup.html
```

Expected: ≥ 10 (one for each hook in PosUi.astro).

- [ ] **Step 4: Commit**

```bash
git add public/styles.css
git commit -m "POS CSS scaffolding: page header, two-column grid, category chips

Lays down the page header, the desktop two-column grid (menu
left, sticky cart right), the sticky category chip bar with
scroll-spy active state, and the empty-cart panel. Item cards,
cart line items, detail panel, checkout, confirmation, and
mobile responsive are added in subsequent tasks."
```

---

## Task 4: Menu rendering in pos.js — categories, item cards, scroll-spy

**Files:**
- Create: `public/pos.js`
- Modify: `public/styles.css` (append item-card rules)

The first chunk of `pos.js`. Reads `window.KALA_MENU`, renders the category chips and the per-category menu sections with item cards. Wires the chip click → anchor scroll, and scroll-spy to highlight the active chip.

- [ ] **Step 1: Append item-card CSS to `public/styles.css`**

At the end of the file (after the Task 3 block), append:

```css
/* Menu item cards (POS) */
.pos-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: clamp(14px, 1.8vw, 22px);
}
.pos-item-card {
  background: var(--white);
  border: 1px solid rgba(34,37,46,.08);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .25s var(--ease), box-shadow .25s var(--ease), border-color .2s var(--ease);
  text-align: left;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  color: inherit;
  padding: 0;
}
.pos-item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
  border-color: rgba(25,75,158,.25);
}
.pos-item-image {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--cream);
}
.pos-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pos-item-body {
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pos-item-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.pos-item-head h3 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 19px;
  color: var(--charcoal);
  margin: 0;
}
.pos-item-price {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--blue-primary);
  font-size: 16px;
}
.pos-item-desc {
  color: var(--slate);
  font-size: 13.5px;
  margin: 0;
  line-height: 1.5;
}
```

- [ ] **Step 2: Create `public/pos.js` with the menu rendering module**

```js
/* KALA POS — customer-facing online ordering UI.
   Activates only on pages that contain [data-pos-ui]. */

(() => {
  'use strict';

  const root = document.querySelector('[data-pos-ui]');
  if (!root) return;   // Not on a POS page — bail.

  const menu = window.KALA_MENU;
  if (!menu) {
    console.warn('[KALA POS] window.KALA_MENU is not defined.');
    return;
  }

  const $  = (sel, ctx = root) => ctx.querySelector(sel);
  const $$ = (sel, ctx = root) => Array.from(ctx.querySelectorAll(sel));

  const fulfillment = root.dataset.fulfillment;   // 'pickup' or 'delivery'

  /* ─── Menu render ─── */

  const catsContainer  = $('[data-pos-cats]');
  const menuContainer  = $('[data-pos-menu]');

  // Category chips
  catsContainer.innerHTML = menu.categories.map(cat => `
    <a class="pos-cat-chip" href="#pos-cat-${cat.id}" data-cat-id="${cat.id}">${escapeHtml(cat.name)}</a>
  `).join('');

  // Category sections
  menuContainer.innerHTML = menu.categories.map(cat => `
    <section class="pos-cat-section" id="pos-cat-${cat.id}" data-cat-id="${cat.id}">
      <header class="pos-cat-section-head">
        <h2>${escapeHtml(cat.name)}</h2>
        ${cat.blurb ? `<p>${escapeHtml(cat.blurb)}</p>` : ''}
      </header>
      <div class="pos-card-grid">
        ${cat.items.map(item => `
          <button type="button" class="pos-item-card" data-item-id="${item.id}" data-cat-id="${cat.id}">
            <div class="pos-item-image">
              <img src="${item.image}" alt="" loading="lazy" />
            </div>
            <div class="pos-item-body">
              <div class="pos-item-head">
                <h3>${escapeHtml(item.name)}</h3>
                <span class="pos-item-price">$${item.price}</span>
              </div>
              <p class="pos-item-desc">${escapeHtml(item.description)}</p>
            </div>
          </button>
        `).join('')}
      </div>
    </section>
  `).join('');

  /* ─── Scroll-spy on category chips ─── */

  const chips = $$('.pos-cat-chip');
  const sections = $$('.pos-cat-section');

  const setActiveChip = (catId) => {
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.catId === catId));
  };

  if ('IntersectionObserver' in window && sections.length) {
    const seen = new Map();   // catId → isIntersecting
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => seen.set(e.target.dataset.catId, e.isIntersecting));
      // Pick the first visible section by document order
      for (const cat of menu.categories) {
        if (seen.get(cat.id)) {
          setActiveChip(cat.id);
          return;
        }
      }
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));
    // Initial highlight
    setActiveChip(menu.categories[0].id);
  }

  /* ─── Helpers ─── */

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Subsequent feature blocks (detail panel, cart, checkout, confirmation)
     are added in following tasks. */

})();
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Visually confirm in dev**

Run `npm run dev`, open the dev URL. Navigate to `/order-pickup`. Expected:
- Page header reads "Order for Pickup"
- Category chips bar shows all 9 category names
- Below: 9 category sections, each with its items as cards (image + name + price + description)
- Clicking a chip scrolls smoothly to that section (browser default anchor scroll)
- As you scroll, the active chip updates to highlight the current section
- Cart on the right shows the empty state

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add public/pos.js public/styles.css
git commit -m "Render POS menu and category nav from window.KALA_MENU

pos.js bails on pages without [data-pos-ui], then on order pages
reads the menu data, renders the category chip bar and the 9
category sections of item cards, and wires scroll-spy so the
active chip highlights the section currently in view.

Item cards are tappable buttons; clicking one does nothing yet —
the detail panel is wired in the next task."
```

---

## Task 5: Item detail panel — modifiers, quantity, add-to-cart

**Files:**
- Modify: `public/pos.js` (append the panel module + cart state stub)
- Modify: `public/styles.css` (append panel + modifier + qty CSS)
- Modify: `src/components/PosUi.astro` (fill in the `[data-pos-detail]` body)

Clicking an item card opens the slide-in detail panel. Renders the item's photo, name, description, modifier groups, and quantity stepper. Tracks the user's current modifier selections and computed price. "Add to cart" stores the configured line item to the cart state (which is initially in-memory; persistence to localStorage comes in Task 6).

- [ ] **Step 1: Fill in the detail panel markup in `src/components/PosUi.astro`**

Find the existing `<div class="pos-detail" data-pos-detail hidden ...>` and replace its content (the comment placeholder) with:

```astro
  <div class="pos-detail" data-pos-detail hidden role="dialog" aria-modal="true" aria-label="Customize item">
    <div class="pos-detail-backdrop" data-pos-detail-close></div>
    <div class="pos-detail-panel" role="document">
      <button type="button" class="pos-detail-close" data-pos-detail-close aria-label="Close">×</button>
      <div class="pos-detail-image">
        <img data-pos-detail-img src="" alt="" />
      </div>
      <div class="pos-detail-body">
        <div class="pos-detail-head">
          <h2 data-pos-detail-name></h2>
          <span class="pos-detail-base-price" data-pos-detail-base-price></span>
        </div>
        <p class="pos-detail-desc" data-pos-detail-desc></p>
        <div data-pos-detail-mods></div>
        <div class="pos-detail-qty">
          <span class="pos-detail-qty-label">Quantity</span>
          <div class="pos-detail-qty-stepper">
            <button type="button" class="pos-qty-btn" data-pos-detail-qty-minus aria-label="Decrease quantity">−</button>
            <span class="pos-qty-value" data-pos-detail-qty>1</span>
            <button type="button" class="pos-qty-btn" data-pos-detail-qty-plus aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-lg pos-detail-add" data-pos-detail-add>
          Add to cart · <span data-pos-detail-total>$0</span>
        </button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Append detail-panel CSS to `public/styles.css`**

At the end of `public/styles.css`, append:

```css
/* Detail panel */
.pos-detail[hidden] { display: none; }
.pos-detail {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}
.pos-detail-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 22, 30, .42);
  opacity: 0;
  transition: opacity .25s var(--ease);
  pointer-events: auto;
}
.pos-detail.is-open .pos-detail-backdrop { opacity: 1; }
.pos-detail-panel {
  position: relative;
  width: clamp(360px, 38vw, 520px);
  max-width: 100%;
  height: 100%;
  background: var(--white);
  box-shadow: -20px 0 50px -10px rgba(0,0,0,.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(100%);
  transition: transform .35s var(--ease);
  pointer-events: auto;
}
.pos-detail.is-open .pos-detail-panel { transform: translateX(0); }
.pos-detail-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(34,37,46,.12);
  color: var(--charcoal);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.pos-detail-image {
  aspect-ratio: 5 / 3;
  background: var(--cream);
  flex-shrink: 0;
}
.pos-detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pos-detail-body {
  padding: 24px 28px 28px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.pos-detail-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}
.pos-detail-head h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 28px;
  color: var(--charcoal);
  margin: 0;
}
.pos-detail-base-price {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--blue-primary);
  font-size: 18px;
}
.pos-detail-desc {
  color: var(--slate);
  font-size: 15px;
  line-height: 1.55;
  margin: 0;
}

/* Modifier groups */
.pos-mod-group {
  border-top: 1px solid rgba(34,37,46,.08);
  padding-top: 16px;
}
.pos-mod-group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}
.pos-mod-group-name {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14.5px;
  color: var(--charcoal);
  letter-spacing: .01em;
}
.pos-mod-group-req {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--slate);
}
.pos-mod-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pos-mod-pill {
  background: var(--white);
  border: 1px solid rgba(34,37,46,.18);
  color: var(--charcoal);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13.5px;
  cursor: pointer;
  transition: background .15s var(--ease), color .15s var(--ease), border-color .15s var(--ease);
}
.pos-mod-pill:hover {
  border-color: var(--blue-primary);
}
.pos-mod-pill.is-selected {
  background: var(--blue-primary);
  border-color: var(--blue-primary);
  color: var(--white);
}
.pos-mod-delta {
  margin-left: 6px;
  font-size: 12px;
  opacity: .8;
}

/* Quantity stepper (reused on detail and cart) */
.pos-detail-qty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(34,37,46,.08);
  padding-top: 16px;
}
.pos-detail-qty-label {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14.5px;
  color: var(--charcoal);
}
.pos-detail-qty-stepper,
.pos-cart-qty-stepper {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: var(--cream);
  border-radius: 999px;
  padding: 4px;
}
.pos-qty-btn {
  background: var(--white);
  border: 1px solid rgba(34,37,46,.12);
  border-radius: 999px;
  width: 32px;
  height: 32px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  color: var(--charcoal);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pos-qty-btn:hover { border-color: var(--blue-primary); color: var(--blue-primary); }
.pos-qty-value {
  min-width: 28px;
  text-align: center;
  font-weight: 600;
  font-size: 15px;
  color: var(--charcoal);
}

/* Add-to-cart full-width button */
.pos-detail-add {
  margin-top: 4px;
  width: 100%;
}
```

- [ ] **Step 3: Append the detail-panel module to `public/pos.js`**

Inside the existing IIFE, after the menu-render block and before the closing `})();`, append:

```js
/* ─── Cart state (in-memory only for now; localStorage in Task 6) ─── */

let cart = [];    // [{ lineId, itemId, catId, name, image, basePrice, modifiers: [{groupId, optionId, label, delta}], qty, lineTotal }]

const newLineId = () => 'l-' + Math.random().toString(36).slice(2, 9);

/* ─── Detail panel ─── */

const detail        = $('[data-pos-detail]');
const detailImg     = $('[data-pos-detail-img]');
const detailName    = $('[data-pos-detail-name]');
const detailBase    = $('[data-pos-detail-base-price]');
const detailDesc    = $('[data-pos-detail-desc]');
const detailMods    = $('[data-pos-detail-mods]');
const detailQtyEl   = $('[data-pos-detail-qty]');
const detailQtyMinus= $('[data-pos-detail-qty-minus]');
const detailQtyPlus = $('[data-pos-detail-qty-plus]');
const detailAdd     = $('[data-pos-detail-add]');
const detailTotalEl = $('[data-pos-detail-total]');

let detailState = null;
// { item, selections: { [groupId]: optionId }, qty }

const findItem = (catId, itemId) => {
  const cat = menu.categories.find(c => c.id === catId);
  if (!cat) return null;
  return cat.items.find(i => i.id === itemId) || null;
};

const computeDetailTotal = () => {
  if (!detailState) return 0;
  const { item, selections, qty } = detailState;
  let unit = item.price;
  item.modifiers.forEach(group => {
    const selOptId = selections[group.id];
    if (!selOptId) return;
    const opt = group.options.find(o => o.id === selOptId);
    if (opt) unit += opt.delta;
  });
  return unit * qty;
};

const renderDetail = () => {
  if (!detailState) return;
  const { item, selections, qty } = detailState;

  detailImg.src = item.image;
  detailImg.alt = item.name;
  detailName.textContent = item.name;
  detailBase.textContent = '$' + item.price;
  detailDesc.textContent = item.description;
  detailQtyEl.textContent = String(qty);
  detailTotalEl.textContent = '$' + computeDetailTotal();

  // Modifier groups
  detailMods.innerHTML = item.modifiers.map(group => `
    <div class="pos-mod-group" data-group-id="${group.id}">
      <div class="pos-mod-group-head">
        <span class="pos-mod-group-name">${escapeHtml(group.name)}</span>
        <span class="pos-mod-group-req">${group.required ? 'Required' : 'Optional'}</span>
      </div>
      <div class="pos-mod-options">
        ${group.options.map(opt => {
          const isSel = selections[group.id] === opt.id;
          const deltaStr = opt.delta > 0 ? `<span class="pos-mod-delta">+$${opt.delta}</span>` : '';
          return `<button type="button" class="pos-mod-pill ${isSel ? 'is-selected' : ''}" data-opt-id="${opt.id}">${escapeHtml(opt.label)}${deltaStr}</button>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  // Wire pill clicks
  detailMods.querySelectorAll('.pos-mod-group').forEach(groupEl => {
    const gid = groupEl.dataset.groupId;
    groupEl.querySelectorAll('.pos-mod-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        detailState.selections[gid] = pill.dataset.optId;
        renderDetail();
      });
    });
  });
};

const openDetail = (catId, itemId) => {
  const item = findItem(catId, itemId);
  if (!item) return;

  // Default selections: first option of each REQUIRED group; nothing for optional
  const selections = {};
  item.modifiers.forEach(g => {
    if (g.required && g.options.length) selections[g.id] = g.options[0].id;
  });

  detailState = { item, selections, qty: 1 };
  detail.hidden = false;
  // Force a reflow so the transition runs
  requestAnimationFrame(() => detail.classList.add('is-open'));
  renderDetail();
  // Focus the close button so keyboard users can dismiss
  setTimeout(() => $('[data-pos-detail-close]', detail)?.focus(), 100);
};

const closeDetail = () => {
  detail.classList.remove('is-open');
  setTimeout(() => {
    detail.hidden = true;
    detailState = null;
  }, 300);
};

// Open on item card click
menuContainer.addEventListener('click', (e) => {
  const card = e.target.closest('.pos-item-card');
  if (!card) return;
  openDetail(card.dataset.catId, card.dataset.itemId);
});

// Close on backdrop, close button, Esc
$$('[data-pos-detail-close]').forEach(el => el.addEventListener('click', closeDetail));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !detail.hidden) closeDetail();
});

// Quantity stepper
detailQtyMinus.addEventListener('click', () => {
  if (!detailState) return;
  if (detailState.qty <= 1) return;
  detailState.qty--;
  renderDetail();
});
detailQtyPlus.addEventListener('click', () => {
  if (!detailState) return;
  detailState.qty++;
  renderDetail();
});

// Add to cart — stores the line and closes the panel.
// Cart sidebar render is wired in Task 6.
detailAdd.addEventListener('click', () => {
  if (!detailState) return;
  const { item, selections, qty } = detailState;
  const modifiers = item.modifiers.map(g => {
    const selOptId = selections[g.id];
    if (!selOptId) return null;
    const opt = g.options.find(o => o.id === selOptId);
    if (!opt) return null;
    return { groupId: g.id, optionId: opt.id, label: opt.label, delta: opt.delta };
  }).filter(Boolean);

  const lineTotal = computeDetailTotal();
  cart.push({
    lineId: newLineId(),
    itemId: item.id,
    catId: detailState.item.id,
    name: item.name,
    image: item.image,
    basePrice: item.price,
    modifiers,
    qty,
    lineTotal
  });

  closeDetail();
});
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Visually confirm in dev**

```bash
npm run dev
```

Open `/order-pickup`. Expected:
- Click a Tzatziki card → detail panel slides in from the right
- Shows tzatziki image, name, price ($7), description, no modifier groups (dips have none), quantity stepper, "Add to cart · $7" button
- Click + → quantity becomes 2, button updates to "Add to cart · $14"
- Click × or press Esc or click the backdrop → panel closes
- Click a Gyro card (Classic Pork) → detail panel opens with the "Meat" modifier group showing Pork / Chicken / Lamb (+$2). Pork is preselected.
- Click "Lamb" → pill highlights, "Add to cart" updates to $15 (13 + 2)
- Click "Add to cart" → panel closes. Cart sidebar still shows empty state (the cart sidebar render is wired in Task 6 — for now, opening the browser console and typing `cart` won't work because it's IIFE-scoped, but you can verify clicks don't error).

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/PosUi.astro public/pos.js public/styles.css
git commit -m "Add item detail panel with modifiers and quantity

Tapping an item card opens a right-slide panel (desktop) with
photo, description, modifier groups (where applicable), and a
quantity stepper. Required modifier groups default-select their
first option. Add to cart pushes a configured line into the
in-memory cart array; the cart sidebar render that displays
those lines comes in the next task."
```

---

## Task 6: Cart sidebar render + localStorage persistence

**Files:**
- Modify: `public/pos.js` (append the cart-render module)
- Modify: `public/styles.css` (append cart-line-item CSS)

The cart was being mutated in Task 5 but never displayed. This task renders cart lines (with thumbnails, modifiers, qty steppers, remove buttons), updates the subtotal, toggles the empty-state visibility, and persists the cart to `localStorage` so it survives page refresh.

- [ ] **Step 1: Append cart-line CSS to `public/styles.css`**

```css
/* Cart line items */
.pos-cart-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.pos-cart-line {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(34,37,46,.08);
}
.pos-cart-line:last-child { border-bottom: none; padding-bottom: 0; }
.pos-cart-line-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: var(--cream);
  overflow: hidden;
}
.pos-cart-line-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pos-cart-line-body { min-width: 0; }
.pos-cart-line-name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 16px;
  color: var(--charcoal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.pos-cart-line-mods {
  font-size: 12.5px;
  color: var(--slate);
  margin: 1px 0 6px;
}
.pos-cart-line-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pos-cart-line-price {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--charcoal);
  font-size: 14.5px;
}
.pos-cart-line-remove {
  background: transparent;
  border: none;
  color: var(--stone-dark);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
  margin-left: 4px;
}
.pos-cart-line-remove:hover { color: var(--charcoal); }

/* Cart footer */
.pos-cart-foot[hidden] { display: none; }
.pos-cart-foot {
  border-top: 1px solid rgba(34,37,46,.08);
  padding-top: 14px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pos-cart-subtotal {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  color: var(--charcoal);
}
.pos-checkout-btn {
  width: 100%;
}
```

- [ ] **Step 2: Append the cart-render module to `public/pos.js`**

Append BEFORE the closing `})();`:

```js
/* ─── Cart render + persistence ─── */

const CART_KEY = 'kala-cart';

const cartItemsEl   = $('[data-pos-cart-items]');
const cartEmptyEl   = $('[data-pos-cart-empty]');
const cartFootEl    = $('[data-pos-cart-foot]');
const cartSubtotalEl= $('[data-pos-cart-subtotal]');

// Load any persisted cart
try {
  const raw = localStorage.getItem(CART_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) cart = parsed;
  }
} catch (e) {
  console.warn('[KALA POS] Failed to load cart from localStorage', e);
}

const saveCart = () => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn('[KALA POS] Failed to save cart', e);
  }
};

const computeSubtotal = () => cart.reduce((sum, line) => sum + line.lineTotal, 0);

const formatModSummary = (modifiers) => {
  if (!modifiers || !modifiers.length) return '';
  return modifiers.map(m => m.label).filter(l => l && l !== 'No thanks').join(' · ');
};

const renderCart = () => {
  const isEmpty = cart.length === 0;
  cartEmptyEl.hidden = !isEmpty;
  cartItemsEl.hidden = isEmpty;
  cartFootEl.hidden  = isEmpty;

  if (!isEmpty) {
    cartItemsEl.innerHTML = cart.map(line => `
      <li class="pos-cart-line" data-line-id="${line.lineId}">
        <div class="pos-cart-line-thumb">
          <img src="${line.image}" alt="" />
        </div>
        <div class="pos-cart-line-body">
          <p class="pos-cart-line-name">${escapeHtml(line.name)}</p>
          ${formatModSummary(line.modifiers) ? `<p class="pos-cart-line-mods">${escapeHtml(formatModSummary(line.modifiers))}</p>` : ''}
          <div class="pos-cart-line-row">
            <div class="pos-cart-qty-stepper">
              <button type="button" class="pos-qty-btn" data-cart-qty-minus aria-label="Decrease quantity">−</button>
              <span class="pos-qty-value">${line.qty}</span>
              <button type="button" class="pos-qty-btn" data-cart-qty-plus aria-label="Increase quantity">+</button>
            </div>
            <span class="pos-cart-line-price">$${line.lineTotal}</span>
          </div>
        </div>
        <button type="button" class="pos-cart-line-remove" data-cart-remove aria-label="Remove ${escapeHtml(line.name)}">×</button>
      </li>
    `).join('');

    cartSubtotalEl.textContent = '$' + computeSubtotal();
  }
};

const recomputeLineTotal = (line) => {
  let unit = line.basePrice + line.modifiers.reduce((s, m) => s + (m.delta || 0), 0);
  line.lineTotal = unit * line.qty;
};

const findLine = (lineId) => cart.find(l => l.lineId === lineId);

// Wire cart interactions via event delegation
cartItemsEl.addEventListener('click', (e) => {
  const lineEl = e.target.closest('.pos-cart-line');
  if (!lineEl) return;
  const line = findLine(lineEl.dataset.lineId);
  if (!line) return;

  if (e.target.closest('[data-cart-qty-minus]')) {
    if (line.qty > 1) {
      line.qty--;
      recomputeLineTotal(line);
      saveCart();
      renderCart();
    }
  } else if (e.target.closest('[data-cart-qty-plus]')) {
    line.qty++;
    recomputeLineTotal(line);
    saveCart();
    renderCart();
  } else if (e.target.closest('[data-cart-remove]')) {
    cart = cart.filter(l => l.lineId !== line.lineId);
    saveCart();
    renderCart();
  }
});

// Re-render after add-to-cart in the detail panel (extend the existing handler)
// We can't easily reach inside the handler above, so we monkey-wrap detailAdd's click:
// Instead, observe cart mutations indirectly: wrap the existing handler.
const _origDetailAdd = detailAdd.onclick;
detailAdd.addEventListener('click', () => {
  // The add-to-cart logic from Task 5 ran first because it's bound earlier.
  // Just re-render and persist now.
  saveCart();
  renderCart();
});

// Initial render
renderCart();
```

**Important wiring note:** the existing detail-panel `addEventListener('click', ...)` from Task 5 runs first (it's bound first). The new listener added here runs second and re-renders the cart. Both listeners coexist because `addEventListener` allows multiple handlers.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Visually confirm in dev**

```bash
npm run dev
```

Open `/order-pickup`. Expected flow:
- Cart shows "Your order is empty."
- Click Tzatziki → open detail → Add to cart → panel closes; cart now shows 1 line: Tzatziki, $7, qty 1, with - 1 + stepper and a × remove
- Subtotal shows $7
- Click + on the cart line → qty becomes 2, line price $14, subtotal $14
- Click × → line removed, cart returns to empty state
- Add a Classic Pork Gyro with Lamb modifier → cart shows the line with "Lamb" subtitle and $15
- Refresh the browser → cart is still there (localStorage persistence works)
- Open DevTools console: `localStorage.getItem('kala-cart')` → JSON string of the cart array

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add public/pos.js public/styles.css
git commit -m "Render cart sidebar with line items, qty editing, localStorage

Each added item renders as a cart line with thumbnail, name,
modifier summary, qty stepper, price, and remove. Subtotal
updates on every mutation. Cart contents are persisted under
the 'kala-cart' localStorage key and rehydrated on page load
so a refresh doesn't wipe the order in progress."
```

---

## Task 7: Inline checkout form

**Files:**
- Modify: `src/components/PosUi.astro` (fill in the `[data-pos-checkout]` body)
- Modify: `public/pos.js` (append checkout module)
- Modify: `public/styles.css` (append checkout CSS)

Clicking "Proceed to checkout" transitions the cart sidebar into a checkout form. Form has time-slot selection, customer info (with conditional delivery address), and a fake-payment section with a demo banner. A "Back to cart" button returns to the cart view without losing state.

- [ ] **Step 1: Fill in the checkout markup in `src/components/PosUi.astro`**

Find the existing `<div class="pos-checkout" data-pos-checkout hidden>` and replace its content with:

```astro
      <div class="pos-checkout" data-pos-checkout hidden>
        <header class="pos-checkout-head">
          <button type="button" class="pos-checkout-back" data-pos-checkout-close aria-label="Back to cart">
            ← Back to cart
          </button>
          <h2>Checkout</h2>
        </header>

        <form class="pos-checkout-form" data-pos-checkout-form novalidate>
          <!-- Time -->
          <fieldset class="pos-cko-fs">
            <legend class="pos-cko-legend" data-pos-cko-time-legend>Pickup time</legend>
            <div class="pos-cko-slots" data-pos-cko-slots>
              <!-- Slot pills inserted by JS -->
            </div>
          </fieldset>

          <!-- Customer details -->
          <fieldset class="pos-cko-fs">
            <legend class="pos-cko-legend">Your details</legend>
            <label class="pos-cko-field">
              <span>Name</span>
              <input type="text" name="name" autocomplete="name" required />
            </label>
            <label class="pos-cko-field">
              <span>Phone</span>
              <input type="tel" name="phone" autocomplete="tel" required />
            </label>
            <label class="pos-cko-field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required />
            </label>
            <label class="pos-cko-field" data-pos-cko-address-field hidden>
              <span>Delivery address</span>
              <input type="text" name="address" autocomplete="street-address" />
            </label>
          </fieldset>

          <!-- Payment (disabled / demo) -->
          <fieldset class="pos-cko-fs pos-cko-pay">
            <legend class="pos-cko-legend">Payment</legend>
            <p class="pos-cko-demo-banner">Demo mode — no real payment is processed.</p>
            <label class="pos-cko-field">
              <span>Card number</span>
              <input type="text" name="card" placeholder="•••• •••• •••• ••••" disabled />
            </label>
            <div class="pos-cko-row">
              <label class="pos-cko-field">
                <span>Expiry</span>
                <input type="text" name="expiry" placeholder="MM / YY" disabled />
              </label>
              <label class="pos-cko-field">
                <span>CVC</span>
                <input type="text" name="cvc" placeholder="•••" disabled />
              </label>
            </div>
          </fieldset>

          <button type="submit" class="btn btn-primary btn-lg pos-cko-submit">
            Place order · <span data-pos-cko-total>$0</span>
          </button>
        </form>
      </div>
```

- [ ] **Step 2: Append checkout CSS to `public/styles.css`**

```css
/* Inline checkout */
.pos-checkout[hidden] { display: none; }
.pos-checkout {
  background: var(--white);
  border: 1px solid rgba(34,37,46,.08);
  border-radius: 14px;
  padding: 22px;
  box-shadow: var(--shadow-soft);
  max-height: calc(100vh - 110px);
  overflow-y: auto;
}
.pos-checkout-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.pos-checkout-head h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 24px;
  color: var(--charcoal);
  margin: 0;
}
.pos-checkout-back {
  background: transparent;
  border: none;
  color: var(--blue-primary);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: .03em;
  cursor: pointer;
  padding: 0;
}

.pos-checkout-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.pos-cko-fs {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pos-cko-legend {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 13.5px;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--slate);
  padding: 0;
  margin-bottom: 4px;
}

/* Time slot pills */
.pos-cko-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pos-cko-slot {
  background: var(--white);
  border: 1px solid rgba(34,37,46,.18);
  color: var(--charcoal);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13.5px;
  cursor: pointer;
  transition: background .15s var(--ease), color .15s var(--ease), border-color .15s var(--ease);
}
.pos-cko-slot:hover { border-color: var(--blue-primary); }
.pos-cko-slot.is-selected {
  background: var(--blue-primary);
  border-color: var(--blue-primary);
  color: var(--white);
}

/* Form fields */
.pos-cko-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pos-cko-field span {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--slate);
  letter-spacing: .02em;
}
.pos-cko-field input {
  font-family: var(--font-body);
  font-size: 15px;
  padding: 10px 12px;
  border: 1px solid rgba(34,37,46,.15);
  border-radius: 8px;
  background: var(--white);
  color: var(--charcoal);
}
.pos-cko-field input:focus {
  outline: none;
  border-color: var(--blue-primary);
  box-shadow: 0 0 0 3px rgba(25,75,158,.12);
}
.pos-cko-field input:disabled {
  background: var(--cream);
  color: var(--stone-dark);
  cursor: not-allowed;
}
.pos-cko-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.pos-cko-demo-banner {
  background: var(--blue-tint);
  color: var(--blue-primary);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12.5px;
  margin: 0 0 4px;
}
.pos-cko-submit {
  width: 100%;
  margin-top: 4px;
}
```

- [ ] **Step 3: Append the checkout module to `public/pos.js`**

Append before the closing `})();`:

```js
/* ─── Checkout ─── */

const checkoutEl       = $('[data-pos-checkout]');
const checkoutOpenBtn  = $('[data-pos-checkout-open]');
const checkoutCloseBtn = $('[data-pos-checkout-close]');
const cartContainer    = $('.pos-cart');
const checkoutForm     = $('[data-pos-checkout-form]');
const slotsContainer   = $('[data-pos-cko-slots]');
const timeLegend       = $('[data-pos-cko-time-legend]');
const addressField     = $('[data-pos-cko-address-field]');
const ckoTotalEl       = $('[data-pos-cko-total]');

// Time-slot generation: ASAP + next 4 15-min slots
const buildSlots = () => {
  const readyMin = (menu.fulfillment[fulfillment] && menu.fulfillment[fulfillment].ready_minutes) || 25;
  const now = new Date();
  // Round up to next 15-min mark for the first non-ASAP slot
  const next = new Date(now.getTime() + readyMin * 60000);
  next.setMinutes(Math.ceil(next.getMinutes() / 15) * 15, 0, 0);

  const fmt = (d) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'p' : 'a';
    h = ((h + 11) % 12) + 1;
    return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
  };

  const slots = [{ value: 'asap', label: `ASAP (~${readyMin} min)` }];
  for (let i = 0; i < 4; i++) {
    const d = new Date(next.getTime() + i * 15 * 60000);
    slots.push({ value: d.toISOString(), label: fmt(d) });
  }
  return slots;
};

const renderSlots = () => {
  const slots = buildSlots();
  slotsContainer.innerHTML = slots.map((s, i) => `
    <button type="button" class="pos-cko-slot ${i === 0 ? 'is-selected' : ''}" data-slot-value="${escapeHtml(s.value)}" data-slot-label="${escapeHtml(s.label)}">
      ${escapeHtml(s.label)}
    </button>
  `).join('');
};

const openCheckout = () => {
  cartContainer.hidden = true;
  checkoutEl.hidden = false;
  // Fulfillment-specific
  timeLegend.textContent = fulfillment === 'pickup' ? 'Pickup time' : 'Delivery time';
  addressField.hidden = fulfillment !== 'delivery';
  if (fulfillment === 'delivery') {
    addressField.querySelector('input').required = true;
  }
  renderSlots();
  ckoTotalEl.textContent = '$' + computeSubtotal();
};

const closeCheckout = () => {
  checkoutEl.hidden = true;
  cartContainer.hidden = false;
};

checkoutOpenBtn.addEventListener('click', () => {
  if (cart.length === 0) return;   // shouldn't happen but defensive
  openCheckout();
});
checkoutCloseBtn.addEventListener('click', closeCheckout);

// Slot pill click selects exclusively
slotsContainer.addEventListener('click', (e) => {
  const pill = e.target.closest('.pos-cko-slot');
  if (!pill) return;
  slotsContainer.querySelectorAll('.pos-cko-slot').forEach(p => p.classList.remove('is-selected'));
  pill.classList.add('is-selected');
});

// Submit handler — confirmation render in Task 8.
// For now, prevent submission and console.log the order.
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(checkoutForm);
  const selectedSlot = slotsContainer.querySelector('.pos-cko-slot.is-selected');
  const order = {
    fulfillment,
    slot: selectedSlot ? selectedSlot.dataset.slotLabel : 'ASAP',
    name: fd.get('name'),
    phone: fd.get('phone'),
    email: fd.get('email'),
    address: fd.get('address') || null,
    items: cart,
    subtotal: computeSubtotal()
  };
  console.log('[KALA POS] Order placed (demo):', order);
  // Task 8 hooks in here to render the confirmation screen.
});
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Open `/order-pickup`. Expected:
- Add an item to cart → click "Proceed to checkout" → cart hides, checkout form appears in its place
- Time legend says "Pickup time"; address field is NOT shown
- "ASAP (~25 min)" preselected; 4 future 15-min slots visible
- Customer details fields editable
- Payment section: blue demo-mode banner; card / expiry / CVC inputs all disabled and grayed
- "Back to cart" returns to cart view; cart contents preserved
- Click "Place order" → form submission prevented; check the console for the order object

Open `/order-delivery`. Expected:
- Same flow but legend says "Delivery time" and the address field appears

Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/PosUi.astro public/pos.js public/styles.css
git commit -m "Add inline POS checkout with fake payment

Proceed to checkout swaps the cart for a checkout form in the
right column: ASAP + 4 future 15-min slots, customer info,
fulfillment-aware delivery address (delivery only), and a
disabled fake-payment section with a 'Demo mode' banner.

Submit is prevented; the confirmation screen render lands in
the next task."
```

---

## Task 8: Confirmation screen

**Files:**
- Modify: `src/components/PosUi.astro` (fill in the `[data-pos-confirm]` body)
- Modify: `public/pos.js` (append confirmation render + extend the submit handler)
- Modify: `public/styles.css` (append confirmation CSS)

After "Place order" the POS clears the menu, cart, and checkout, and renders a centered confirmation card with a fake order number, ETA, and an itemized receipt.

- [ ] **Step 1: Fill in confirmation markup in `src/components/PosUi.astro`**

Replace the existing `<div class="pos-confirm" ...>` content with:

```astro
  <div class="pos-confirm" data-pos-confirm hidden>
    <div class="pos-confirm-card container">
      <div class="meander-divider" aria-hidden="true"></div>
      <span class="eyebrow pos-confirm-eyebrow">Order placed</span>
      <h2 class="pos-confirm-thanks">Thank you, <span data-pos-confirm-name></span>.</h2>
      <p class="pos-confirm-order-no">Order <strong data-pos-confirm-no></strong></p>
      <p class="pos-confirm-eta" data-pos-confirm-eta></p>

      <div class="pos-confirm-receipt">
        <h3>Your order</h3>
        <ul data-pos-confirm-items></ul>
        <div class="pos-confirm-subtotal">
          <span>Subtotal</span>
          <span data-pos-confirm-subtotal></span>
        </div>
      </div>

      <div class="pos-confirm-actions">
        <a href="/" class="btn btn-primary btn-lg">Back to home</a>
        <button type="button" class="btn btn-ghost btn-lg" disabled aria-disabled="true" title="Tracking not available in demo">
          Track order
        </button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Append confirmation CSS to `public/styles.css`**

```css
/* Confirmation screen */
.pos-confirm[hidden] { display: none; }
.pos-confirm {
  background: var(--cream);
  min-height: 80vh;
  padding: clamp(40px, 8vw, 100px) 0;
}
.pos-confirm-card {
  max-width: 640px;
  background: var(--white);
  border: 1px solid rgba(34,37,46,.08);
  border-radius: 18px;
  padding: clamp(28px, 5vw, 56px);
  box-shadow: var(--shadow-soft);
  text-align: center;
}
.pos-confirm-card .meander-divider {
  margin: -16px auto 24px;
  width: 80%;
}
.pos-confirm-eyebrow { display: block; margin-bottom: 12px; }
.pos-confirm-thanks {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(28px, 4vw, 38px);
  color: var(--charcoal);
  margin: 0 0 12px;
}
.pos-confirm-order-no {
  font-size: 14.5px;
  color: var(--slate);
  margin: 0 0 6px;
}
.pos-confirm-order-no strong {
  font-family: var(--font-wordmark);
  letter-spacing: .06em;
  color: var(--blue-primary);
  margin-left: 6px;
  font-size: 16px;
}
.pos-confirm-eta {
  color: var(--slate);
  font-size: 15px;
  margin: 0 0 28px;
}
.pos-confirm-receipt {
  text-align: left;
  background: var(--cream);
  border-radius: 12px;
  padding: 20px;
  margin: 0 auto 28px;
}
.pos-confirm-receipt h3 {
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--slate);
  margin: 0 0 12px;
}
.pos-confirm-receipt ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.pos-confirm-receipt li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(34,37,46,.08);
  font-size: 14.5px;
}
.pos-confirm-receipt li:last-child { border-bottom: none; }
.pos-confirm-line-meta {
  display: block;
  font-size: 12.5px;
  color: var(--slate);
  margin-top: 2px;
}
.pos-confirm-subtotal {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(34,37,46,.12);
  font-weight: 600;
  color: var(--charcoal);
}
.pos-confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
.pos-confirm-actions .btn[disabled] {
  opacity: .6;
  cursor: not-allowed;
}

/* Hide the cart/menu/header when confirmation is showing */
.pos-ui.is-confirming .pos-header,
.pos-ui.is-confirming .pos-grid,
.pos-ui.is-confirming .pos-detail,
.pos-ui.is-confirming .pos-mobile-bar { display: none; }
```

- [ ] **Step 3: Extend the submit handler in `public/pos.js`**

Find the existing `checkoutForm.addEventListener('submit', ...)` from Task 7 and REPLACE its body (the part inside the handler) with:

```js
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(checkoutForm);
  const selectedSlot = slotsContainer.querySelector('.pos-cko-slot.is-selected');
  const order = {
    fulfillment,
    slot: selectedSlot ? selectedSlot.dataset.slotLabel : 'ASAP',
    name: (fd.get('name') || '').toString().trim() || 'guest',
    phone: fd.get('phone'),
    email: fd.get('email'),
    address: fd.get('address') || null,
    items: cart.slice(),
    subtotal: computeSubtotal(),
    orderNo: 'KALA-' + Math.floor(100000 + Math.random() * 900000).toString()
  };
  renderConfirmation(order);
  // Clear cart from state + storage
  cart = [];
  saveCart();
});
```

Then append the confirmation render function before the closing `})();`:

```js
/* ─── Confirmation ─── */

const confirmEl       = $('[data-pos-confirm]');
const confirmName     = $('[data-pos-confirm-name]');
const confirmNo       = $('[data-pos-confirm-no]');
const confirmEta      = $('[data-pos-confirm-eta]');
const confirmItems    = $('[data-pos-confirm-items]');
const confirmSubtotal = $('[data-pos-confirm-subtotal]');

const renderConfirmation = (order) => {
  confirmName.textContent = order.name;
  confirmNo.textContent = order.orderNo;

  const ready = order.slot.startsWith('ASAP')
    ? new Date(Date.now() + (menu.fulfillment[fulfillment].ready_minutes || 25) * 60000)
    : null;
  const etaLabel = order.slot.startsWith('ASAP')
    ? `${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} ready by ~${formatTime(ready)}`
    : `${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} at ${order.slot}`;
  confirmEta.textContent = etaLabel;

  confirmItems.innerHTML = order.items.map(line => `
    <li>
      <div>
        <strong>${escapeHtml(line.name)}</strong>
        ${formatModSummary(line.modifiers) ? `<span class="pos-confirm-line-meta">${escapeHtml(formatModSummary(line.modifiers))}</span>` : ''}
        ${line.qty > 1 ? `<span class="pos-confirm-line-meta">Qty ${line.qty}</span>` : ''}
      </div>
      <span>$${line.lineTotal}</span>
    </li>
  `).join('');
  confirmSubtotal.textContent = '$' + order.subtotal;

  root.classList.add('is-confirming');
  confirmEl.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const formatTime = (d) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'p' : 'a';
  h = ((h + 11) % 12) + 1;
  return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
};
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Open `/order-pickup`. Expected:
- Add items, proceed to checkout, fill in name+phone+email, click "Place order"
- Page transitions to the centered confirmation card
- Heading: "Thank you, &lt;name&gt;." with the typed name
- Order number: KALA-XXXXXX (6 random digits)
- ETA: "Pickup ready by ~&lt;time&gt;" computed from now + 25 min
- Itemized receipt with each line (qty if > 1, modifier label if any)
- Subtotal at the bottom
- "Back to home" button works (goes to /), "Track order" is disabled
- Refresh the page → cart was cleared, so /order-pickup loads back at the empty-cart state

Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/PosUi.astro public/pos.js public/styles.css
git commit -m "Add POS confirmation screen with receipt and ETA

After 'Place order', a centered confirmation card replaces the
menu/cart/checkout UI. Shows a thank-you with the customer
name, a generated KALA-XXXXXX order number, the fulfillment ETA
computed from the configured ready_minutes, an itemized receipt
of every line, and the subtotal. Cart is cleared from
localStorage on confirmation."
```

---

## Task 9: Mobile responsive — sticky bottom cart bar + sheets

**Files:**
- Modify: `public/pos.js` (append mobile bar wiring + sheet open/close hooks)
- Modify: `public/styles.css` (append mobile styles)

On viewports ≤900px, the cart column is hidden. A sticky bottom bar shows item count + subtotal and opens a full-screen cart sheet. The detail panel also becomes a bottom-up sheet at this width. The checkout form, when reached, replaces the cart sheet contents (already works because checkout lives inside the cart column — when the sheet shows, it shows the right markup).

- [ ] **Step 1: Append mobile CSS to `public/styles.css`**

```css
/* Mobile bottom bar (only ≤900px) */
.pos-mobile-bar[hidden] { display: none; }
.pos-mobile-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: var(--blue-primary);
  color: var(--white);
  border: none;
  padding: 14px 20px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: 0 -8px 20px -10px rgba(20,22,30,.35);
}
.pos-mobile-bar-count { letter-spacing: .02em; }
.pos-mobile-bar-arrow { font-size: 18px; }

@media (min-width: 901px) {
  .pos-mobile-bar { display: none !important; }
}

/* Cart-as-sheet on mobile */
@media (max-width: 900px) {
  .pos-cart-col {
    /* Override the desktop "display: none" — we now toggle visibility via JS */
    display: block;
    position: fixed;
    inset: 0;
    top: auto;
    bottom: 0;
    z-index: 35;
    max-height: 90vh;
    transform: translateY(100%);
    transition: transform .35s var(--ease);
    background: var(--white);
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
    overflow: hidden;
    box-shadow: 0 -10px 30px -10px rgba(20,22,30,.3);
  }
  .pos-cart-col.is-open { transform: translateY(0); }
  .pos-cart {
    border-radius: 0;
    border: none;
    box-shadow: none;
    max-height: 90vh;
    height: 90vh;
    padding-top: 30px;
    position: relative;
  }
  .pos-cart::before {
    content: '';
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 44px;
    height: 4px;
    background: rgba(34,37,46,.18);
    border-radius: 999px;
  }
  .pos-checkout {
    border-radius: 0;
    border: none;
    box-shadow: none;
    max-height: 90vh;
  }

  /* Detail panel as a bottom sheet */
  .pos-detail { justify-content: stretch; }
  .pos-detail-panel {
    width: 100%;
    height: 90vh;
    transform: translateY(100%);
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
  }
  .pos-detail.is-open .pos-detail-panel { transform: translateY(0); }
  .pos-detail-image { aspect-ratio: 3 / 2; }
}

/* Item card grid narrower phones */
@media (max-width: 480px) {
  .pos-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .pos-item-body { padding: 12px 12px 14px; }
  .pos-item-head h3 { font-size: 16px; }
}
```

- [ ] **Step 2: Append mobile bar wiring to `public/pos.js`**

Append before the closing `})();`:

```js
/* ─── Mobile bottom bar ─── */

const mobileBar = $('[data-pos-mobile-bar]');
const mobileBarCount = $('.pos-mobile-bar-count', mobileBar);
const cartCol = $('.pos-cart-col');

const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

const updateMobileBar = () => {
  const onMobile = isMobile();
  // Always render the count; we leave actual show/hide to media query + cart count
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = computeSubtotal();
  if (count === 0 || !onMobile) {
    mobileBar.hidden = true;
    return;
  }
  mobileBar.hidden = false;
  mobileBarCount.textContent = `Cart (${count}) · $${subtotal}`;
};

const openMobileCart = () => {
  cartCol.classList.add('is-open');
  document.body.style.overflow = 'hidden';
};
const closeMobileCart = () => {
  cartCol.classList.remove('is-open');
  document.body.style.overflow = '';
};

mobileBar.addEventListener('click', openMobileCart);

// Tap outside the cart sheet closes it (i.e., on the backdrop area above the sheet).
// We can implement this by closing when the user taps anywhere that's not inside .pos-cart-col while it's open.
document.addEventListener('click', (e) => {
  if (!isMobile()) return;
  if (!cartCol.classList.contains('is-open')) return;
  if (cartCol.contains(e.target)) return;
  if (mobileBar.contains(e.target)) return;
  closeMobileCart();
});

// Esc closes the mobile cart sheet
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartCol.classList.contains('is-open')) closeMobileCart();
});

// After every cart mutation, re-check the bar
const _origRenderCart = renderCart;
const wrappedRenderCart = () => {
  _origRenderCart();
  updateMobileBar();
};
// Replace the renderCart reference globally is tricky inside this IIFE.
// Instead, just call updateMobileBar after every known mutation point:
//   - initial load (done above)
//   - cart line click handler
//   - detail-panel add-to-cart handler
// Easiest: hook the events we already have.
cartItemsEl.addEventListener('click', updateMobileBar);
detailAdd.addEventListener('click', () => setTimeout(updateMobileBar, 0));

// Also re-check on resize (entering/leaving mobile)
window.addEventListener('resize', updateMobileBar);

// Initial run
updateMobileBar();
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Open `/order-pickup` in Chrome DevTools responsive mode, set viewport to 375×812 (iPhone X). Expected:
- Menu shows in a single column (2-up item cards at this narrow width)
- Cart sidebar is not visible in the layout
- Sticky bottom bar at the bottom of viewport reads "Cart (0) · $0" — actually hidden when empty
- Tap a Tzatziki card → detail panel slides up from bottom as a sheet
- Adjust qty → tap "Add to cart"
- Bottom bar now visible: "Cart (1) · $7"
- Tap the bar → cart sheet slides up from bottom showing the line item, qty stepper, remove, subtotal
- Tap outside the sheet (the area above it) → sheet closes
- Tap the bar again, then tap "Proceed to checkout" → sheet now shows the checkout form
- Fill in fields → "Place order" → confirmation screen replaces everything (works because it's a fixed overlay)

At 1440 desktop width: the mobile bar is gone, cart is back to the sticky right column.

- [ ] **Step 5: Commit**

```bash
git add public/pos.js public/styles.css
git commit -m "Add mobile POS bottom cart bar and bottom-sheet treatments

On viewports ≤900px the cart column converts to a bottom sheet
toggled by a sticky 'Cart (N) · \$XX' bar. Tap-outside and Esc
close the sheet. The detail panel also slides up from the
bottom on mobile. Item card grid drops to 2 columns at ≤480px."
```

---

## Task 10: Final smoke test

**Files:**
- No file changes (verification only)

A complete end-to-end manual smoke test of every page and breakpoint. The user reviews and confirms before any deploy.

- [ ] **Step 1: Build the production output**

```bash
npm run build && npm run preview
```

Open the URL Astro reports.

- [ ] **Step 2: Run the checklist on the preview build**

Test each item and fix anything that fails before declaring complete.

**Desktop (≥1280px):**
- [ ] `/order` — three cards render; clicking Pickup goes to `/order-pickup`; Delivery to `/order-delivery`; Catering to `/contact`
- [ ] `/order-pickup` — page header reads "Order for Pickup"
- [ ] `/order-delivery` — page header reads "Order for Delivery"
- [ ] All 9 category sections render with item cards (44 items total)
- [ ] Category chip bar sticky at top, scroll-spy highlights active category
- [ ] Click any dip item → detail panel slides in from right with image, name, price, description, qty stepper. No modifier groups for dips. Add to cart works; panel closes.
- [ ] Click a Gyro item → meat modifier group shown with Pork preselected; selecting Lamb adds +$2 to the displayed total
- [ ] Click a Souvlaki item → meat modifier group as above
- [ ] Click a Salad item → optional "Add protein" group shown; "No thanks" preselected; selecting "Grilled chicken" adds +$5
- [ ] Cart sidebar updates with each add: thumbnail, name, modifier summary, qty stepper, line price, × remove
- [ ] Subtotal updates on every change
- [ ] Click cart line + → qty up; − → qty down (down to 1); × → line removed
- [ ] Refresh page → cart contents persist
- [ ] Click "Proceed to checkout" → checkout form appears in cart column
- [ ] On `/order-delivery` only: address field appears in customer details
- [ ] Payment fields are disabled with "Demo mode" banner
- [ ] "Back to cart" returns to cart view with contents intact
- [ ] Fill in name+phone+email; click "Place order" → confirmation screen
- [ ] Confirmation shows thank-you with name, KALA-XXXXXX order number, ETA, itemized receipt, subtotal
- [ ] "Back to home" goes to /
- [ ] "Track order" button is disabled

**Tablet (768×1024):**
- [ ] `/order-pickup` still uses two columns (breakpoint is at 901px); layout is just tighter
- [ ] Cart visible, sticky

**Mobile (375×812):**
- [ ] Single column menu
- [ ] Cart not visible in layout
- [ ] Sticky bottom bar appears when cart has items
- [ ] Tap bottom bar → cart sheet slides up from bottom
- [ ] Tap detail card → detail panel slides up from bottom
- [ ] Item cards in 2-up grid at narrow widths
- [ ] Full checkout + confirmation flow works on mobile

**Cross-browser sanity (whatever you have available):**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if Mac)

- [ ] **Step 3: User visual confirmation**

Tell the user: "POS implementation complete. Live at the preview URL — click through each page (especially the order flow). Let me know if anything looks off before push + deploy."

Wait for explicit user approval. Fix any reported issues by re-opening the relevant task and re-committing.

- [ ] **Step 4: No additional commits unless smoke-test reveals issues**

---

## Out of scope (do NOT do)

- Real payment processing or Stripe/Square integration
- Server-side order storage; orders disappear after the confirmation screen
- Account creation, login, order history
- Kitchen/staff display side of the system
- Catering ordering flow — the Catering card on `/order` continues to route to `/contact`
- Tax calculation, tip line
- Real delivery address validation, distance/fee calculation
- Real time-slot availability — the 4 future slots are computed from "now" each render
- A11y deep work beyond keyboard-navigable panels, labels, focus-on-open, Esc-to-close
