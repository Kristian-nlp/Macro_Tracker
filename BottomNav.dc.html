# Handoff: Macro Tracker — "The Grid" redesign

## Overview
A complete visual + UX redesign of the Macro Tracker app (calorie & macro logging PWA).
The direction is **"The Grid"**: calories-remaining is shown as **three rows of dots**, and every
meal is tagged by the **macro it is mostly made of** using a shape + colour. Earthy, calm,
built from simple geometric shapes.

Six screens are designed: **Sign in, Today (home), Add a meal, Review estimate, History, Settings.**

## About the design files
The files in `prototype/` are **design references built in HTML** (an inline-styled component
format — `*.dc.html`). They are prototypes that show the intended look, layout, and behaviour.
**They are not production code to copy.** Your job is to **re-create these designs in the existing
`Macro_Tracker` Next.js codebase**, using its established patterns (React components, the
`lib/css.ts` style approach, `next/font`, the existing API routes and data layer).

- The **inline `style="…"` values in the prototype are the source of truth** for exact colours,
  sizes, radii, and spacing. Read them when a value isn't spelled out below.
- The **device chrome is mock-only**: the `StatusBar` (9:41, notch, battery) and the rounded
  phone bezel exist only to make the mock look like a phone. Do **not** build them — the OS / PWA
  shell provides the status bar.
- `support.js` is the prototype runtime; ignore it for implementation. To preview the prototype,
  open `prototype/Macro Tracker Redesign.dc.html` in a browser (all six screens render side by side).

## Fidelity
**High-fidelity.** Final colours, typography, spacing, and interactions. Recreate pixel-faithfully
using the codebase's libraries. Where the codebase already has a primitive (button, input), match
the spec by adjusting tokens rather than inventing a parallel system.

---

## Design tokens

### Colour
| Token | Hex | Use |
|---|---|---|
| `paper` | `#F4F1E8` | App background |
| `sheet` | `#EFECE3` | Modal-sheet background (Add / Review) |
| `surface` | `#FCFAF4` | Cards, fields, list rows |
| `ink` | `#1B1D17` | Primary text, big numbers |
| `ink-soft` | `#41503A` | Pressed/strong sage text |
| `muted` | `#7A7E6F` | Secondary text |
| `muted-2` | `#9A9C8F` | Tertiary text / value suffixes |
| `label` | `#8A8D7E` | Overline labels |
| `hairline` | `#EBE7D9` | Inner dividers |
| `border` | `#E8E4D6` | Card borders (`#E4E0D2` on sheets, `#E0DCCE` on inputs) |
| **`sage`** | **`#55654C`** | **Primary brand + Protein** |
| `sage-tint` | `#E7EADF` | Sage chip/marker background |
| `dot-empty` | `#DCE0D2` | Unfilled calorie dot |
| **`terracotta`** | **`#BC6440`** | **Carbs + "over budget"** |
| `terracotta-tint` | `#F1DFD5` | Carb marker bg (`#F3E2D9` over-badge) |
| **`ochre`** | **`#C2974A`** | **Fat** |
| `ochre-tint` | `#F0E6D2` | Fat marker bg |
| `canvas` | `#E2DFD5` | Presentation board only — NOT an app colour |

### Typography
- **Display / headings / all numbers:** `Space Grotesk` (weights 400/500/600/700). Load via `next/font/google`.
- **Tabular data (kcal, grams, deltas):** `Space Mono` (400/700).
- **Body / UI labels:** system stack (`system-ui, -apple-system, 'Segoe UI', sans-serif`).
- **Overline label:** 11px, `letter-spacing:.14em`, `text-transform:uppercase`, weight 600, colour `#8A8D7E`.

| Role | Family | Size / weight | Notes |
|---|---|---|---|
| Hero number (calories left) | Space Grotesk | 54px / 700 | `letter-spacing:-.03em` |
| Screen title (History/Settings) | Space Grotesk | 26px / 700 | `-.02em` |
| Sheet title (Add/Review) | Space Grotesk | 22px / 700 | |
| Card / row title | Space Grotesk | 15–17px / 500–600 | |
| Body | system-ui | 15px / 400 | |
| Mono data | Space Mono | 14–18px / 400 | tabular figures |

### Radius / shadow / spacing
- **Radius:** cards 16–24px · inputs/buttons 13–14px · pills/avatars 999px · marker chips 11–15px · phone bezel 46px (mock only).
- **Shadows:** primary button `0 12px 24px -10px rgba(85,101,76,.6)` · floating quick-add `0 10px 26px -14px rgba(20,22,18,.3)`.
- **Screen padding:** 28px horizontal (26px on sheets). Card inner padding 16–22px. Common gaps 10–14px.

---

## The two signature systems (most important)

### 1. Calorie dot grid
- **36 dots in 3 rows × 12 columns.** CSS: `display:grid; grid-template-columns:repeat(12,1fr); gap:9px;`
  each dot `width:100%; aspect-ratio:1; border-radius:50%`.
- **Fill = consumed / target, proportional:** `filled = round(min(consumed/target, 1) * 36)`.
  Filled dots = `sage (#55654C)`, empty = `#DCE0D2`.
- **Over budget** (`consumed > target`): render **all 36 dots terracotta** (`#BC6440`).
- **It is driven by the daily target.** When the user changes their target (Settings), the grid
  re-fills automatically — fewer dots filled for a bigger target, more for a smaller one.
- **History** reuses the same grid at small scale (gap 3px, ~118px wide) — one mini-grid per day,
  sage when under target, terracotta when over.

### 2. Macro markers (shape + colour = dominant macro)
- Each meal is tagged by the macro it is **mostly made of, by calorie contribution**:
  `protein*4`, `carbs*4`, `fat*9` → pick the max (tie-break order protein → carbs → fat).
- Mapping (used everywhere — meal rows, favourites, the logo, macro legends):

  | Macro | Shape | Colour | Chip tint |
  |---|---|---|---|
  | Protein | ● circle | `#55654C` | `#E7EADF` |
  | Carbs | ■ rounded square | `#BC6440` | `#F1DFD5` |
  | Fat | ▲ triangle | `#C2974A` | `#F0E6D2` |

- On a meal row the **dominant macro's value is bolded in its colour** in the `P.. · C.. · F..`
  line (others are muted `#A6A89A`).
- Shapes are pure CSS (circle = border-radius; square = border-radius:4px; triangle = CSS borders).
  See `prototype/MealRow.dc.html` for the exact logic.

---

## Screens

> Layout note: every screen is a 390px-wide column → `StatusBar` (mock) → scrollable content →
> pinned footer (quick-add and/or bottom nav). Build the content + footer; skip the mock chrome.

### 1. Sign in (`screenshots/01-login.png`)
- **Purpose:** authenticate.
- **Layout:** vertical flex; logo block top, form pinned bottom (32px padding).
- **Logo:** the three macro shapes in a row (circle `#55654C`, square `#BC6440`, triangle `#C2974A`),
  then wordmark **`macro.`** — Space Grotesk 700, 42px, with the period in sage. Tagline below in muted.
- **Form:** **Username** field (label "Username", value e.g. `kristian`) — **username, not email**;
  Password field with eye toggle; **Sign in** primary button (sage, full-width, 14px radius);
  "New here? **Create an account**" link (sage emphasis).

### 2. Today (`screenshots/02-today.png`)
- **Purpose:** see calories left + macros, review/add meals.
- **Header:** weekday overline + date ("23 June", Space Grotesk 700 23px); right: **Training/Rest**
  day pill (sage tint) + avatar (sage circle, initial).
- **Hero card** (`surface`, 24px radius): overline "Calories left"; big number (54px) + "of 2,600 kcal";
  the **3×12 dot grid**; legend "1,800 eaten / 800 left".
- **Macro cards** (3, equal width): each has a coloured macro marker + name, `current/target` (mono),
  and a thin progress bar (protein 85%, carbs 64%, fat 73% in the mock). Bar fill = macro colour.
- **Today list:** "Today · 4 meals" then meal rows (see Components → MealRow).
- **Footer:** floating **quick-add** bar ("Describe a meal…" + camera + barcode icons) above the bottom nav.

### 3. Add a meal (`screenshots/03-add-meal.png`)
- **Purpose:** log a meal fast. Presented as a **bottom sheet** (grab handle, title "Add a meal", × close).
- **Capture card** — "Snap it, describe it — or both": a row of photo thumbnails (an attached photo
  with an × to remove, plus a dashed "Add" photo button) **and** a free-text description, feeding **one
  `Estimate` button** (sage). Photo + text are combined, not either/or.
- **`OR` divider**, then **Scan a barcode** row (packaged food → exact label data).
- **Favourites:** one-tap re-add rows (marker chip + name + "kcal · mostly X" + circular `+`).

### 4. Review estimate (`screenshots/04-review-estimate.png`)
- **Purpose:** confirm/adjust the AI's estimate before it lands on the day. Bottom sheet.
- **Meal header:** dominant-macro marker tile + editable name (pencil) + "Estimated from your photo & description".
- **Macro card:** big calorie number + "Mostly fat" pill; three rows **Protein / Carbs / Fat** each with a
  stepper (`−` value `g` `+`).
- **Portion** segmented control (½ · 1 · 1½ · 2; "1" selected).
- **Footer:** **Add to Today** primary; **Save to favourites** ghost.

### 5. History (`screenshots/05-history.png`)
- **Purpose:** review past days; export.
- **Header:** "History" + **Export** pill (download icon) → Excel/CSV (existing export feature).
- **7-day average card** (solid sage, white text): big average kcal + "5/7 on target" + a 7-bar week strip
  (white = on target, ochre = off, faded = no data).
- **Recent days list:** each row = weekday + date | **mini dot-grid** | total kcal (mono) + delta badge
  (`−50` sage tint / `+140` terracotta tint).

### 6. Settings (`screenshots/06-settings.png`)
- **Purpose:** targets + account + data.
- **Profile card:** avatar + name + **@username** (not email) + chevron.
- **Daily targets card:** Training day (2,600) / Rest day (2,200) rows + "Today is" **Training/Rest**
  segmented toggle. Caption: "Change a target and Today's dots re-fill to match." *(This is where the
  dot grid's target comes from.)*
- **Macro targets card:** Protein 190g / Carbs 280g / Fat 70g (each with its marker).
- **Data card:** Favourites (count, chevron) · **Export to Excel**.
- **Sign out** (terracotta text). Footer: bottom nav (Settings active).

---

## Interactions & behaviour
- **Bottom nav** (Today · History · Settings, with a raised **`+`** as the **right-most** item):
  navigates between the three primary tabs; `+` opens the **Add a meal** sheet.
- **Logging flow:** `+` → Add a meal → (type and/or attach photo) **Estimate** → Review estimate →
  **Add to Today** → back to Today with the new meal + updated dots/macros. Tapping a **favourite's `+`**
  adds it immediately (skips Review). **Scan a barcode** → packaged-food path.
- **Day type** toggle (Training/Rest) swaps the active daily target → recomputes calories-left, the dot
  grid fill, and macro targets.
- **Steppers / portion** on Review adjust the estimate live before saving.
- **Export** (History + Settings) → existing Excel export.
- All marker shapes/colours are derived from data (dominant macro) — never hard-coded per meal.

## State management
- `user` `{ username }` — **username-based auth, no email.**
- `dayType: 'training' | 'rest'` → selects `target` from `targets.trainingKcal` / `targets.restKcal`.
- `targets` `{ trainingKcal, restKcal, protein_g, carbs_g, fat_g }` (Settings-editable).
- `meals: [{ id, title, time, slotLabel, kcal, protein_g, carbs_g, fat_g }]` for today; `consumed`,
  `proteinTotal`… are sums. `left = target − consumed`.
- `favourites: [{ title, kcal, protein_g, carbs_g, fat_g }]`.
- `history: [{ date, kcal, target }]` → drives mini-grids + deltas + 7-day average.
- Derived (compute, don't store): dot-grid fill count, dominant macro per meal, over/under state + colours.

## Suggested mapping to the `Macro_Tracker` repo
- **Tokens** → `lib/css.ts` (add the colour/type/radius/shadow constants above).
- **Fonts** → `next/font/google` for Space Grotesk + Space Mono; expose CSS variables.
- **Replace** `components/Vessel.tsx` with a new **`DotGrid`** hero (the 3×12 grid).
- **New components:** `DotGrid`, `MacroMarker` (shape+colour from macros), `MealRow`, `BottomNav`,
  `MacroBar`, `DayCard` (history), `MacroStepper` (review). `StatusBar` is **not** needed.
- **Screens** → `app/page.tsx` (Today), `app/history/`, `app/login/` (username), a Settings route,
  and the Add/Review sheets as modal routes or a client sheet component.
- Reuse existing OpenAI estimate + barcode + Excel-export logic; this redesign only changes the UI.

## Assets
- **No raster images.** All icons are inline SVG (camera, barcode, clock, gear, chevron, plus, eye,
  download/export, edit pencil, info). Re-draw with your icon set (e.g. lucide) at matching stroke weights.
- **Logo** = the three macro shapes + the `macro.` wordmark (pure CSS/text — no image file).
- Marker shapes (circle/square/triangle) are pure CSS.
- The photo thumbnail on "Add a meal" is a placeholder; real photos come from the user's camera/library.

## Files in this package
- `prototype/Macro Tracker Redesign.dc.html` — all six screens (the source of truth for exact styles).
- `prototype/MealRow.dc.html` — meal row + the dominant-macro marker logic.
- `prototype/BottomNav.dc.html` — bottom navigation (`+` on the right).
- `prototype/StatusBar.dc.html` — mock device status bar (reference only; do not build).
- `prototype/support.js` — prototype runtime (ignore for implementation).
- `screenshots/01–06…png` — rendered reference of each screen.
