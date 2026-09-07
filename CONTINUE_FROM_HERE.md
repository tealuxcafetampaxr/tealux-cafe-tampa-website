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

## New: counter kiosk display (2026-09-06) — built, DB migration NOT yet run

New `/kiosk` project, same repo/domain/Supabase project as the rest of the site (decided against a
separate branch — Netlify only deploys `main`, so a branch alone doesn't share hosting; a new
top-level folder deployed on `main` does).

- `tealuxcafetampa.com/kiosk/` — public, unauthenticated display for a tablet mounted at the
  counter. Rotates through active `kiosk_cards` (12s each, fades), refetches every 3 min so
  content updates without touching the tablet. Falls back to a plain welcome message if the table
  is empty/missing or the fetch fails — degrades gracefully.
- `tealuxcafetampa.com/kiosk/admin/manage.html` — separate lightweight admin (not folded into
  items.html/board.html, per the user's choice), reusing the *same* login/session
  (`admin/js/supabase-client.js`) and the existing `item-images` storage bucket for media (path
  prefix `kiosk/...`). Add/edit/delete cards, toggle active, reorder with up/down buttons (no
  drag-and-drop — kept intentionally simple). Linked from the main admin nav ("Kiosk") on all 5
  admin pages.
- Content model: one `kiosk_cards` table, `type` is `'highlight'` (this week's featured item,
  shown with a badge) or `'promo'` (rotating announcement) — both just rotate together in
  `sort_order`, no separate layout logic for the two. Each card's media is either a photo or a
  video (`media_url` + `media_type`) — the admin file picker accepts both and the display
  auto-plays video muted/looped/full-bleed instead of a background-image.

**Not done yet:**
- `supabase/migration_009_kiosk.sql` has NOT been run on the live DB. The kiosk display will just
  show the empty-state welcome message and the manage page will error on load until it's run
  (Supabase SQL Editor, same as every other migration).
- Not yet click-tested live with real data — once the migration's run, add a card via
  `/kiosk/admin/manage.html` and confirm it shows up at `/kiosk/` (allow up to 3 min for the
  display's poll, or just reload it).
- No physical tablet set up yet — this was built for "a tablet mounted at the counter" per the
  user, but the actual device/kiosk-mode browser setup is still to be done.

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
