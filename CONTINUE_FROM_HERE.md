# Continue From Here

Last worked on: 2026-09-06. Read this before doing anything else on the admin tool.

## Status: deployed, click-through tested, actively iterating

The admin tool is live at `tealuxcafetampa.com/admin/login.html` (unlisted on purpose — no
link from the public site; decided 2026-08-14, revisit only if Kha/Chao ask for a
bookmark-free way in).

Latest pushed commit: `4b44178` — "Narrow Cakes column to clear the coin photo, widen Desserts".
Everything is pushed, DB-side is fully set up (all 10 SQL files run, no errors), and the Screen 3
redesign below has been click-tested live and confirmed good by the user (2026-08-15).

**No uncommitted local work right now.**

## Kiosk: transition style setting (fade/slide/none) + a real race-condition bug fix (2026-09-06)

Added `supabase/migration_011_kiosk_settings.sql` — a single-row `kiosk_settings` table
(`transition_style`: `'fade'` | `'slide'` | `'none'`), global (not per-card, unlike duration —
mixing transition styles between different card-pairs would look inconsistent). Editable via a
new "Transition Between Cards" dropdown at the top of `/kiosk/admin/manage.html`. **This migration
has NOT been run on the live DB yet** — until it is, the display just falls back to fade (its
always-safe default) and the admin setting won't persist.

Public read / authenticated write, same RLS pattern as everything else. The display
(`kiosk-display.js`) applies the setting as a `data-transition` attribute on the `.kiosk` root;
`kiosk.css` scopes the slide/none CSS under `.kiosk[data-transition="..."]`, fade being the
attribute-less default. `showCard()` now also tracks an `is-prev` class (the just-previous active
card) alongside `is-active` — needed for slide's exit animation, harmless no-op for fade/none.

**Real bug found and fixed while testing this, not a hypothetical:** `loadSettings()` and
`loadCards()` used to fire concurrently with no ordering guarantee (`loadSettings(); loadCards();`
— neither awaited). If the cards fetch won the race, `renderCard()` would build all the card
elements *before* `data-transition` was set on `.kiosk`. Confirmed by direct testing: Chrome does
not reliably re-resolve a percentage-based CSS transform (`translateX(100%)`, used by the slide
style) on an element that already existed before the attribute that triggers it was set — works
correctly when the attribute is present *before* the element is created, silently fails
(computes as identity/no transform) when applied retroactively to an existing element. Fixed by
combining both into one `refresh()` that always awaits settings before cards, on both the initial
load and every periodic refresh. Verified with the real (non-mocked) `refresh()` function, not just
a hand-rolled reproduction, by temporarily stubbing the settings query — all three styles
(fade/slide/none) confirmed correct afterward.

## Kiosk: confirmed working on the actual physical tablet (2026-09-06)

User ran the kiosk display on the real Samsung Galaxy Tab E 8.0 (see specs below) at the same time
as testing here — video autoplay and the CSS fade transition both worked with no issues. This
resolves the "JS/CSS compatibility unverified" caveat in the section below — it's now a confirmed
fact, not a guess. Logo overlay ("TEALUX CAFE / TAMPA" at the top) was removed since the user's
photos/videos already carry the branding baked in — one less redundant element on a small screen.

Also discussed and deliberately kept as-is: transition style between cards. Options considered
were cross-fade (current), slide, and instant-cut; user picked cross-fade to stay conservative
before knowing the tablet handled things fine. Now that the tablet's confirmed capable, revisit if
they want to try slide instead — no code changes needed unless they ask.

## Kiosk: per-card title-visibility toggle + display duration (2026-09-06) — migration NOT run yet

Added to the kiosk build below, after it was already live: `supabase/migration_010_kiosk_card_options.sql`
adds `show_title` (bool, default true) and `duration_seconds` (int, default 12) to `kiosk_cards`.
**This migration has NOT been run on the live DB yet** — until it is, saving/editing a card via
`/kiosk/admin/manage.html` will error (the columns don't exist), so run it before using the admin
again.

- "Show title on the kiosk display" checkbox — lets staff keep a title on the card (so it's
  identifiable in the admin list) without it being drawn over a photo/video that already has text
  baked in. Independent of whether the title field has a value at all (see "Title is optional"
  above) — this only controls whether a *present* title actually renders.
- "Display Duration (seconds)" — per-card, not global. A quick promo and a slower highlight
  shouldn't necessarily get the same amount of screen time, so each card sets its own; the display
  reads whichever card is currently showing and reschedules the rotation timer using that card's
  duration each time (not one fixed interval for every card). Defaults to 12s if left blank.

## New: counter kiosk display (2026-09-06) — built, live-tested, DB migration IS run

New `/kiosk` project, same repo/domain/Supabase project as the rest of the site (decided against a
separate branch — Netlify only deploys `main`, so a branch alone doesn't share hosting; a new
top-level folder deployed on `main` does). Pushed live and click-tested end-to-end with real
content on 2026-09-06 — see "Confirmed working" below.

**Physical tablet (confirmed 2026-09-06):** Samsung Galaxy Tab E 8.0 (SM-T377V), 800×1280 portrait,
Android 7.1.1 Nougat, ~1.5GB RAM, ~9-10 years old. **Display is locked to portrait** — this is the
target, not landscape (earlier in the build we assumed landscape; the user corrected this once the
actual device was confirmed). Because the WebView on a device this old may be stuck on a fairly
ancient Chromium build, `kiosk/css/kiosk.css` deliberately avoids CSS the WebView might not
support: no `inset` shorthand (needs Chrome 87+, replaced with explicit `top/right/bottom/left:0`),
no flexbox `gap` (needs Chrome 84+, replaced with margins on `.kiosk-dot`). Font sizes/padding are
also tuned specifically for the real 800px-wide portrait viewport via a `max-width: 900px` media
query. JS compatibility (arrow functions, template literals, async/await, etc.) and video autoplay
have since been **confirmed working on the actual device** — see the dated entry above.

- `tealuxcafetampa.com/kiosk/` — public, unauthenticated display. Full-bleed photo or autoplaying
  muted/looped video fills the whole screen (`object-fit: cover`, so it adapts to any aspect ratio
  without separate layout branches); title/subtitle/price sit in a dark gradient scrim at the
  bottom, legible over any image. Rotates through active `kiosk_cards` (12s each, fades), refetches
  every 3 min so content updates without touching the tablet. Falls back to a plain welcome message
  if the table is empty/missing or the fetch fails — degrades gracefully.
- `tealuxcafetampa.com/kiosk/admin/manage.html` — separate lightweight admin (not folded into
  items.html/board.html, per the user's choice), reusing the *same* login/session
  (`admin/js/supabase-client.js`) and the existing `item-images` storage bucket for media (path
  prefix `kiosk/...`). Add/edit/delete cards, toggle active, reorder with up/down buttons (no
  drag-and-drop — kept intentionally simple). Linked from the main admin nav ("Kiosk") on all 5
  admin pages. **Title is optional** — the user's photos/videos often already have text baked in
  (e.g. a designed promo graphic), so a card doesn't need a separate title/subtitle to be valid;
  blank-titled cards show as "Untitled card" in the admin list only (never shown to customers).
- Content model: one `kiosk_cards` table, `type` is `'highlight'` (this week's featured item,
  shown with a badge) or `'promo'` (rotating announcement) — both just rotate together in
  `sort_order`, no separate layout logic for the two. Each card's media is either a photo or a
  video (`media_url` + `media_type`) — the admin file picker accepts both.

**Confirmed working (real click-through, live data, 2026-09-06):** logged into
`/kiosk/admin/manage.html` live, uploaded the user's two real test files (`test-kiosk-image-01.png`,
a "Coffee Week" promo graphic; `test-kiosk-video-01.mp4`, an animated version of the same graphic —
they look near-identical at a glance, that's expected, not a bug) as one highlight card and one
promo card, saved both, and confirmed both render correctly at `/kiosk/` on production — badge,
logo overlay, scrim, video autoplay, and pagination dots all worked. Also re-verified at the real
800×1280 portrait resolution via a local iframe harness (not part of the repo) — text/price/dots
all fit cleanly with the tuned media-query sizing.

**Tablet is up and running the display** (per the user, 2026-09-06) — not just a one-off test
anymore. Side benefit: this should resolve the earlier Supabase free-tier auto-pause issue as a
natural side effect, not something separately built — the display polls `kiosk_cards`/
`kiosk_settings` every 3 minutes as long as it's running, which is enough regular API activity to
keep the project active (auto-pause only triggers after ~7 days of *zero* activity). Only matters
if the tablet is actually left running day to day, same condition as above.

**Not done yet:**
- Unconfirmed whether it's in an actual kiosk-mode browser app (e.g. Fully Kiosk Browser) for
  full-screen/auto-launch/always-on behavior, or just a regular browser tab someone left open —
  worth checking if it needs to survive a reboot/power cycle unattended.
- Original two test cards (`Test Kiosk Image`, `Test Kiosk Video`) have since been replaced — the
  user added several real cards (boba drink promo graphics) via `/kiosk/admin/manage.html`
  directly, using the optional-title feature (blank titles, since the graphics have text baked in).

Also fixed in passing: `admin/css/admin.css` still had the pre-rebrand dull yellow
(`#D4B700`/`#B89E00`) after the site-wide brand color fix below — updated to match, and fixed a
real (not just latent) white-text-on-yellow contrast bug in `.btn-crimson`, which is actively used
for the "+ Add Item" button.

## Supabase free-tier auto-pause caused a login outage (2026-09-06)

User reported "loading error" on login. Root cause: the Supabase project (free tier) had
auto-paused from inactivity — Supabase pauses free projects after ~7 days with no API activity.
Every request to `bayaotnzbzhotfrupzhx.supabase.co` (including `/auth/v1/token`) was returning
503, which `login.html` surfaced as "Failed to fetch". Not a code bug — verified `login.html` and
`supabase-client.js` behave correctly once the project is live.

Fixed by the user manually restoring the project from the Supabase dashboard. Restore took a
couple minutes to fully come back online (kept getting 503 on `/auth/v1/token` for ~15-20s after
the dashboard said "restored" before it actually worked) — don't assume it's still broken if the
first retry right after unpausing still 503s.

Decision: leaving it on the free tier as-is (no scheduled keep-alive ping, no upgrade to paid).
If this recurs and becomes a real problem, the options are: upgrade to Supabase Pro (no
auto-pause), or set up a periodic ping to keep it active.

**Outstanding data-cleanup task** (unrelated to Screen 3, from 2026-08-14): the pre-fix version of
Save could duplicate items in `section_items` if Save was double-clicked — this happened for real
to the user before the fix landed in `97ee397`. The fix stops it going forward but does NOT
retroactively clean up any duplicate rows already created. Check whichever board(s) were being
edited when this happened — if the same item appears twice in a box, that's a leftover duplicate
`section_items` row that needs deleting in Supabase.

## Screen 3 redesign (2026-08-15) — confirmed working live

New food-photo background art (through two ChatGPT revisions, archived in `templates/examples/`;
`templates/Screen_3.png` is the final `11_55_00 AM` version) with all 5 box coordinates re-measured
against it via PIL pixel scans — not a straight recolor of the old design, positions shifted.

Content changes from the old single-box design, now confirmed live:
- The old "Cakes & Desserts" box is two independently-editable columns: **Desserts** (real item
  list: Tofu Dessert, Mango Shake, Korean Cheese Coin, Korea Ube Cheese Coin, subheading
  "DESSERTS") and **Cakes** (new `'static'` box style — no item list, cakes rotate daily, so it
  just shows a "CAKES" subheading + a fixed "please see cashier for today's specials" message).
  Desserts is 310px wide, Cakes 155px and shifted right (x=775) to clear a mooncake-coin photo
  baked into the background around x=945 — the original even 50/50 split ran under it.
- **Self Serve Ramen's toppings line** now reads from the priced catalog item's Description field
  (edit it on that item's page in `item.html`) instead of a separate manual field in the board
  editor, and wraps to multiple lines instead of truncating with an ellipsis.
- Street Food and Breakfast & Bakery got more breathing room between their subheading and the
  first item row (`contentY` increased).

DB migrations run live, in order, all clean: `migration_006_screen3_desserts_split.sql` (adds the
`'static'` section style, splits the old `cakes_desserts` section into `desserts` + `cakes`),
`migration_007_ramen_ingredients_from_item.sql` (moves ramen toppings text into the item's
Description), `migration_008_desserts_label_rename.sql` (renames "Other Desserts" → "Desserts").
`seed_boards.sql`/`seed_items.sql` updated to match for any future fresh install.

`admin/js/board-renderer.js` is the source of truth for all of this — `BOARD_TEMPLATES.screen_3`
for box coordinates, `drawStaticBox` for the Cakes column, `drawRamenBox` for the ramen toppings.

## If a box's text ever looks misaligned later

Re-measure via PIL color-boundary scan on the source PNG (see `board-renderer.js`
`BOARD_TEMPLATES`) rather than eyeballing new coordinates — this is how every Screen 1/2/3 box was
measured, including the full Screen 3 redesign above.

## Bugs found and fixed 2026-08-14 (real usage on board.html)

1. **Board Save duplicated items on the rendered board.** Root cause: `btn-save`'s click handler
   never disabled the button or guarded against re-entry, and `saveBoard()` never checked any
   Supabase call's `error`. A rapid second click while the first save was still in flight ran the
   whole insert loop again against the same not-yet-reloaded `sections` state (still holding
   `tmp-` ids for newly-added items), inserting a second `section_items` row for each new item.
   Fixed: the button now disables + shows "Saving…" for the duration, guarded by an `isSaving` flag.
2. **No confirmation the save succeeded.** Fixed alongside #1 — the button now shows "Saved ✓"
   (green) or "Save failed — <reason>" (red, since `saveBoard()` now actually surfaces Supabase
   errors instead of silently swallowing them) next to the Save button.
3. **Items with no price showed "$0.00" on the rendered board.** A price of 0 always means
   "nothing entered yet" here, never a real $0 item. Fixed in `board-renderer.js`'s `money()` —
   now returns `''` for 0/null/unset, so nothing renders instead of a fake-looking price. Scoped
   to the rendered board only; admin table views (`items.html`, `board.html`) still show "$0.00"
   deliberately, as a useful signal to the person editing that a price is still missing.

## Confirmed working (real click-through, real data, live site)

- Login/auth gate, items catalog — infinite-loading bug fixed.
- All 3 screens have real data and were clicked through — no layout issues reported.
- Board photos (upload/drag/resize), PNG export, row-spacing slider — all confirmed good on
  Screen 3 (`snippets/screen-3.png`); Screens 1/2 passed a visual click-through too.
- Milk Tea box (Screen 1) text position — was rendering off the left edge, re-measured and fixed.
- Screen 3 redesign (see section above) — click-tested live 2026-08-15, confirmed good.

## Built but not yet browser-tested (pushed in commits `3b509ea`, `c044060`, `df41401`, `97ee397`)

- **Inactive item status** (`migration_004`) — excluded from board dropdowns and skipped by the
  renderer even if already linked to a board.
- **90-day edit history** (`migration_005`) — "Recent Changes" panel on `item.html`/`board.html`,
  human-readable summaries generated at save time, not raw diffs. What/when only, no per-person
  attribution (shared login, confirmed acceptable). "90 days" is a display filter, not deletion.
- **Unsaved-changes warning** — native browser dialog on both pages if you navigate away with
  unsaved edits. Board photos (save instantly on drag-end) don't count as unsaved.
- **`/admin/preview.html`** ("Preview All" button on the boards dashboard) — every board
  rendered side by side in one read-only view, for checking visual consistency across screens.
- **Inline bulk edit on `items.html`** — "Edit" button toggles every currently-filtered row into
  editable cells (name/category/price/status/tag). Search/filter/sort lock while editing so
  nothing disappears mid-edit. "Save Changes" diffs each touched row against its DB original
  (via `diffItemFields`, shared with `item.html`) and only writes + logs history for rows that
  actually changed; "Cancel" discards with no DB calls. Category is existing-categories-only, no
  inline "add new" (that stays exclusive to `item.html`).

## Ongoing manual task (not blocked on anything)

- **Individual item photos** (distinct from board photos) still need uploading one-by-one
  through `/admin/item.html`'s gallery uploader — manual data entry for Kha/Chao, not a build task.

## Quick orientation if resuming cold

- Read `claude-code-prompt-tealux-menu-webapp.md` (original spec) and `admin/SETUP.md` (setup +
  how the renderer works) first.
- DB setup order: `schema.sql` → `migration_002_templates.sql` → `seed_boards.sql` →
  `seed_items.sql` → `migration_003_board_images.sql` → `migration_004_inactive_status.sql` →
  `migration_005_edit_history.sql` → `migration_006_screen3_desserts_split.sql` →
  `migration_007_ramen_ingredients_from_item.sql` → `migration_008_desserts_label_rename.sql`.
  All 10 have been run on the live DB.
- The **section/box layout** is NOT freeform — it's 3 fixed-design PNGs with named content boxes
  at exact coordinates. Don't reintroduce a generic drag-and-drop *layout* builder, that was
  explicitly rejected in favor of matching the real TV designs. **Board photos are the one
  deliberate exception** — freeform upload/drag/resize, rendered as their own layer strictly
  between the background and the item-text layer so a photo can never cover text.
- `admin/js/board-renderer.js` is the single source of truth for template box coordinates,
  font-size auto-shrink, and per-section row spacing (`sections.extra.line_spacing`).
- `admin/js/supabase-client.js` holds shared helpers used across every admin page: session
  gating, edit-history read/write/render, `warnOnUnsavedChanges`, and `diffItemFields`.
