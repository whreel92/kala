# POS / Online ordering UI

**Date:** 2026-05-30
**Status:** Approved design, ready for implementation plan
**Surface:** New `/order-pickup` and `/order-delivery` Astro pages plus shared menu data and POS JS; updates to existing `/order` to wire the three landing cards.

## Summary

The customer-facing online ordering UI for KALA — a polished, demo-quality experience that *looks and feels* like a real POS ordering flow without processing real payments. Reached from the existing three-card landing on `/order` (Pickup, Delivery, Catering). Picking Pickup or Delivery routes to a new ordering page with a two-column layout: menu on the left, sticky cart on the right. Tapping an item opens a slide-in detail panel with modifiers and a quantity selector. Adding items updates the cart, which persists across page refresh via `localStorage`. Checkout expands inline (no page navigation) into a customer-info and fake-payment form. Submitting renders a centered confirmation screen with a fake order number.

## Goals

- Give the existing `/order` landing page a working downstream — clicking Pickup or Delivery actually goes somewhere meaningful instead of `href="#"`.
- Demonstrate a complete ordering UX: menu browsing → item customization → cart → checkout → confirmation.
- Reuse the existing menu items (the 9 categories already on `menu.astro`) so the POS shows the actual KALA menu, not placeholder content.
- Match the existing site visually: cream/blue palette, Cinzel headings, Manrope body, existing `.btn-primary` / `.btn-ghost`, existing meander dividers.
- Work cleanly at mobile, tablet, and desktop widths.

## Non-goals

- No real payment processing. Card fields are present-and-disabled with a "demo mode" banner.
- No backend, no order persistence beyond the user's browser. Submitted orders show a confirmation screen and disappear; they aren't stored anywhere.
- No real delivery address validation, no real pickup time slot enforcement.
- No staff-side / kitchen display side of the system. Customer-facing only.
- No menu admin tools — the menu data is hand-written in a static JS file.
- No catering ordering — Catering keeps its existing inquiry path (whatever that ends up being); it does NOT route into the POS UI.
- No account creation, no order history, no login.

## Entry flow

```
/order  (existing 3-card landing)
  ├─ Pickup card  ─▶  /order-pickup
  ├─ Delivery card ─▶  /order-delivery
  └─ Catering card ─▶  unchanged (existing inquiry path)
```

`/order-pickup` and `/order-delivery` render the *same component* with one prop difference: the page title and the cart's fulfillment label. Both consume the same menu data and the same cart logic.

## Page structure: `/order-pickup` and `/order-delivery`

### Desktop layout (≥901px)

A two-column grid:

```
┌──────────────────────────────────────────────────────────────┐
│ [nav]                                                         │
├──────────────────────────────────────────────────────────────┤
│ Page header: "Order for Pickup" / "Order for Delivery"        │
│ Sub: ready-in estimate, address                               │
├───────────────────────────────────┬──────────────────────────┤
│ Menu (scrollable, left)           │ Cart (sticky, right)     │
│                                   │                          │
│ [category chips, sticky]          │ Your order               │
│   Dips · Salads · Gyros · ...     │                          │
│                                   │ ┌──────────────────────┐ │
│ ┌─── Dips ───┐                    │ │ thumb  Pork Gyro    │ │
│ │ [card] [card] [card]           │ │        Lamb · qty 2 │ │
│ │ [card] [card]                   │ │   −  2  +    $26    │ │
│ └─────────────┘                    │ └──────────────────────┘ │
│                                   │ ┌──────────────────────┐ │
│ ┌─── Salads ───┐                  │ │ thumb  Horiatiki    │ │
│ │ ...                              │ │   −  1  +    $14    │ │
│ └─────────────┘                    │ └──────────────────────┘ │
│ ...                                │                          │
│                                   │ Subtotal       $40       │
│                                   │ [ Proceed to checkout ]  │
│                                   │                          │
└───────────────────────────────────┴──────────────────────────┘
```

- Menu column: ~60% width, scrollable. Category chip bar sticky at top of the column with scroll-spy highlighting the current category.
- Cart column: ~40% width, sticky to viewport (stays in place as you scroll the menu).
- Standard nav and footer from `Base.astro` continue to wrap the page.

### Mobile layout (≤900px)

Single column:

- Menu fills the screen
- Cart is hidden by default
- A sticky bottom bar shows `Cart (N items) · $XX  ›`
- Tapping the bar opens a full-screen cart sheet (slides up from the bottom)

### Detail panel (item customization)

When the user taps a menu item card:

- **Desktop**: a panel slides in from the right edge of the viewport, covering ~40% width. It overlays the cart column.
- **Mobile**: a sheet slides up from the bottom, full screen.

Panel contents:

- Hero image of the item
- Item name (Cinzel) + price
- Description paragraph
- Modifier groups (only the groups that exist for this item — see Menu data)
- Quantity stepper (−/+, default 1)
- "Add to cart · $XX" button (price updates with quantity and modifier deltas)
- Close button (top right on desktop, top left on mobile)
- Pressing Esc closes the panel
- Clicking outside the panel closes it

The panel is *always* shown for every item card tap, even items with no modifiers — the quantity step + price preview is still useful. (This is simpler than branching the UX into "quick-add" for some items vs "panel" for others.)

## Menu data

Lives in a new file `public/menu-data.js`. Exported as a single object:

```js
window.KALA_MENU = {
  categories: [
    {
      id: 'dips',
      name: 'Dips & Spreads',
      items: [
        {
          id: 'tzatziki',
          name: 'Tzatziki',
          price: 7,
          image: '/public/c243bbfd-cba9-4c8b-b273-3abc24c8f935.png',
          description: 'Creamy yogurt and cucumber dip with herbs, garlic, and olive oil.',
          modifiers: []  // none — quantity only
        },
        // ...other dips
      ]
    },
    {
      id: 'gyros',
      name: 'Gyros',
      items: [
        {
          id: 'classic-pork',
          name: 'The Classic Pork',
          price: 13,
          image: '/public/e04b7c58-8d54-487c-9f41-5f660e52bc91.png',
          description: 'Pita, tzatziki, tomato, onion, fries.',
          modifiers: [
            {
              id: 'meat',
              name: 'Meat',
              required: true,
              type: 'single',           // single-choice
              options: [
                { id: 'pork', label: 'Pork',    delta: 0 },
                { id: 'chicken', label: 'Chicken', delta: 0 },
                { id: 'lamb', label: 'Lamb',    delta: 2 }
              ]
            }
          ]
        },
        // ...
      ]
    },
    // ...
  ]
};
```

The exact item set mirrors `src/pages/menu.astro` (9 categories, all items currently on the menu).

**Modifier rules by category** (mock-quality, intentionally simple):

| Category | Modifier groups |
|---|---|
| Dips & Spreads | none |
| Greek Salads | optional "Add protein" — Grilled chicken (+$5), Gyro meat (+$5) |
| Gyros | required "Meat" — Pork (+0), Chicken (+0), Lamb (+$2) |
| Souvlaki | required "Meat" — Chicken (+0), Pork (+0), Lamb (+$2) |
| Seafood | none |
| Plates | none |
| Sides | none |
| Desserts | none |
| Wine | none |

`Wine` is listed in the POS but each item is a single quantity (no glass-vs-bottle choice in this iteration).

## Cart sidebar

### Empty state

A small cream-toned illustration area (CSS only — no new image asset) with:

> Your order is empty.
> Pick a dish from the menu to start.

### Filled state

Each line item:

- Thumbnail (~48×48px) of the item image
- Name (one line, truncates with ellipsis)
- Modifier summary if any ("Lamb" or "+ Grilled chicken")
- Quantity stepper (− 2 +)
- Line price (price × quantity, including modifier delta)
- Remove (×) button

Below all items:

- Subtotal label + amount
- A `[ Proceed to checkout ]` button (primary CTA, full width)

No tax line. No tip line. Subtotal only. (Demo-quality.)

## Checkout (inline expansion)

When "Proceed to checkout" is clicked, the cart column transitions into a checkout form *in place* — the menu column dims and is briefly non-interactive, but doesn't navigate away. The user can press "Back to cart" to return.

Sections (vertical scroll within the checkout form):

1. **Pickup time** (or **Delivery time**)
   - "ASAP" preselected (estimated ready ≈ now + 25 min)
   - Plus 4 future 15-minute slots (e.g., 6:00p, 6:15p, 6:30p, 6:45p)
2. **Your details**
   - Name (text input, required visually)
   - Phone (tel input)
   - Email (email input)
   - **Delivery address** (text input, only present on `/order-delivery`; collapsed/absent on Pickup)
3. **Payment** (visually present, functionally disabled)
   - A small banner at the top of this section: *"Demo mode — no real payment is processed."*
   - Card number, expiry, CVC — all inputs disabled, styled but clearly inert
4. **[ Place order ]** button at the bottom

On submit:
- Generate a fake order number: `KALA-` + a zero-padded 6-digit random integer
- Save the order snapshot (items + customer info + order number) to a local variable (NOT localStorage — the confirmation screen reads from memory, then it's gone)
- Clear the cart localStorage
- Render the confirmation screen

## Confirmation screen

Replaces the page content (header, menu, cart) with a centered card:

- Meander divider at the top (existing `.meander-divider`)
- "Thank you, **&lt;name&gt;**." (Cinzel)
- Order number: `KALA-001847` (large, monospaced or feature-styled)
- Pickup time estimate: "Pickup ready by **~6:45p**" (or delivery equivalent)
- Itemized receipt: list of items with qty, name, modifiers, line totals
- Subtotal line
- Two buttons:
  - `[ Back to home ]` → navigates to `/`
  - `[ Track order ]` → disabled, with a tooltip / inline note: *"Tracking not available in demo."*

## Persistence

- Cart contents persisted to `localStorage` under a single key (e.g., `kala-cart`)
- Saved on every cart mutation
- Loaded on page mount
- Cleared after successful order placement
- Persistence is per-domain, per-browser; resetting `localStorage` clears the cart

## Mobile behavior summary

- ≤900px viewport:
  - Cart column hidden
  - Sticky bottom bar: `Cart (N) · $XX  ›` — primary blue background
  - Tap → cart slides up as a full-screen sheet (close button top-right)
  - Detail panel becomes a bottom sheet
  - Checkout form replaces the cart sheet vertically; no separate "menu dim" because menu is hidden behind the sheet anyway
- ≤700px (narrow phones):
  - Category chip bar can horizontal-scroll
  - Item cards stack 2-up (instead of 3-up)

## Visual style

- Background: brand `--cream` for the page area, `--white` for cards/sheets
- Primary CTA: `.btn-primary` (existing, blue)
- Secondary CTA: `.btn-ghost` (existing, outline)
- Modifier pills: rounded chips, selected state = `--blue-primary` bg with `--white` text
- Quantity stepper: existing `--cream` chip background, `+`/`−` buttons inside
- Cart line items: white background with `--cream` border between
- Detail panel: white background, `--cream` border, blue close icon
- Confirmation: centered max-width card on cream background

No new image assets needed — all imagery is reused from the existing menu items in `public/public/`.

## Files

**New files:**

- `src/pages/order-pickup.astro` — the Pickup ordering page
- `src/pages/order-delivery.astro` — the Delivery ordering page
- `src/components/PosUi.astro` — shared component containing the two-column layout, menu render, cart, detail panel, checkout, confirmation. Both order-pickup.astro and order-delivery.astro render this component with `fulfillment="pickup"` or `fulfillment="delivery"`.
- `public/menu-data.js` — the menu data object (exported on `window.KALA_MENU`)
- `public/pos.js` — the POS interaction module (cart state, localStorage persistence, panel open/close, checkout submission, confirmation render). Loaded only on the order pages.

**Modified files:**

- `src/pages/order.astro` — the three card buttons get real `href` values: Pickup → `/order-pickup`, Delivery → `/order-delivery`, Catering → `/contact` (existing inquiry path)
- `public/styles.css` — appended block: POS layout, item card, detail panel, cart sidebar, checkout form, confirmation screen, modifier pills, quantity stepper, mobile sheet, mobile bottom-bar

## Out of scope (do NOT do)

- Real payment processing (Stripe, Square, etc.)
- Server-side order storage
- Order management/tracking after placement
- Account creation, login, order history
- Menu admin UI
- Catering ordering flow (catering keeps its existing path; only the link target on `/order` changes)
- Kitchen / staff display
- Tax or tip calculation
- Delivery address validation, distance/fee calculation
- Real time-slot availability (the 4 slots are static demo values)
- A11y deep work beyond keyboard-navigable panels and proper labels (a basic level is required; full WCAG audit is out of scope)

## Accessibility

- All form inputs have visible labels
- Detail panel and cart sheet trap focus while open and restore focus to the triggering element on close
- Esc closes any open panel/sheet
- Keyboard: arrow keys navigate within modifier groups (single-choice radio behavior), Tab moves between groups
- All decorative imagery has empty `alt`; item images have real alt text from the menu data
- `prefers-reduced-motion` reduces panel slide-in animations to opacity-only fades

## Risks and known unknowns

- The two-column layout has to share vertical scroll space with a sticky cart — at very short viewports (landscape phone), the cart sidebar might not have enough vertical room. Mobile breakpoint kicks in at ≤900px viewport width but not specifically on viewport height; if this looks bad at landscape phone, a `(max-height: 700px)` breakpoint can also collapse cart to the bottom bar.
- LocalStorage is per-domain — opening the site in a private window starts a fresh cart. That's correct behavior for the demo and matches user expectation.
- Item id stability: items are identified by string `id` in the data file. Renaming an id (e.g., `classic-pork` → `pork-gyro`) would invalidate any cart in any user's localStorage. Acceptable for demo; flag if menu data needs frequent rewrites.

## Open follow-ups (outside this work)

- Final copy for the empty-cart message, the demo-mode banner, and the confirmation screen
- Whether to add a basic "estimated pickup time" calculation (currently fixed at +25 min)
- Whether to add the same UI for `/order-catering` later — for now Catering links to `/contact`
