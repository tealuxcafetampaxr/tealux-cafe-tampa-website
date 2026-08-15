# Continue From Here

Last worked on: 2026-08-15. Read this before doing anything else on the admin tool.

## In progress: Screen 3 redesign (2026-08-15) — committed and pushed, DB migration run, NOT yet click-tested live

New background art dropped in (`templates/examples/ChatGPT Image Aug 15, 2026, 10_54_51 AM.png`,
now copied to `templates/Screen_3.png`) with different box positions than the old design, plus a
content change: the old single "Cakes & Desserts" box is now two side-by-side columns —
"Desserts" (still a real editable item list: Tofu Dessert, Mango Shake, Korean Cheese Coin, Korea
Ube Cheese Coin) and "Cakes" (cakes rotate daily, so instead of listing them it's now a fixed
"please see cashier for today's specials" message — new box style `'static'`, no items, nothing
to edit).

Changed:
- `admin/js/board-renderer.js` — all 5 screen_3 box coordinates re-measured (PIL color-boundary
  scan) against the new background; `cakes_desserts` box replaced by `desserts` (list) + `cakes`
  (new `static` style, draws `CAKES_STATIC_TEXT` centered/wrapped, no section data needed).
- `admin/board.html` — `BOX_LABELS`, `ensureSectionsForTemplate`, `renderSections` (new
  `renderStaticSectionCard`), `diffSections` all updated for the new box_keys and `static` style.
- `supabase/migration_006_screen3_desserts_split.sql` — **run on the live DB 2026-08-15, no
  errors.** Widened the `sections.style` check constraint to allow `'static'`, renamed the live
  `cakes_desserts` section to `desserts` (keeps its existing section_items), stripped the 8
  rotating cake items out of it (they stay in the catalog, just unlinked from this board), and
  inserted the new static `cakes` section.
- `supabase/seed_boards.sql`, `supabase/seed_items.sql` — updated so a *fresh* install seeds the
  new `desserts`/`cakes` box_keys directly instead of the old `cakes_desserts`.
- `admin/SETUP.md` — documents `migration_006` as step 8 in the run order.

Coordinate accuracy was checked by rendering the real `board-renderer.js` against mock data in a
browser (not against live data in the actual admin tool) — all 5 boxes lined up correctly against
the new art. **Still needs a real click-through of Screen 3 in `board.html` with live data** to
confirm nothing looks off in practice — nobody has done that yet.

One known cosmetic issue, not yet addressed: the Desserts column is narrower than the old combined
box (251px vs 720px), so "Korean Cheese Coin" and "Korea Ube Cheese Coin" truncate to "Korean
Che…" on the rendered board. Flagged to the user 2026-08-15, no decision yet on whether to shorten
those item names or leave it.

## Status: deployed, click-through tested, actively iterating

The admin tool is live at `tealuxcafetampa.com/admin/login.html` (unlisted on purpose — no
link from the public site; decided 2026-08-14, revisit only if Kha/Chao ask for a
bookmark-free way in).

Latest pushed commit: `97ee397` — "Fix board Save duplicating items, add save confirmation,
blank out $0.00". Everything is pushed and DB-side is fully set up (all 7 SQL files run, no
errors), but most of it (inactive status, edit history, unsaved-changes warning, Preview All
page, inline bulk edit, the 3 fixes below) has **not yet been click-tested in the browser**.

**No uncommitted local work right now.**

**Outstanding data-cleanup task**: the pre-fix version of Save could duplicate items in
`section_items` if Save was double-clicked (see bug #1 below) — this happened for real to the
user before the fix landed. The fix stops it going forward but does NOT retroactively clean up
any duplicate rows already created. Check whichever board(s) were being edited when this
happened — if the same item appears twice in a box, that's a leftover duplicate `section_items`
row that needs deleting in Supabase.

## Bugs found and fixed 2026-08-14 (real usage on board.html)

1. **Board Save duplicated items on the rendered board.** Root cause: `btn-save`'s click handler
   never disabled the button or guarded against re-entry, and `saveBoard()` never checked any
   Supabase call's `error`. A rapid second click while the first save was still in flight ran the
   whole insert loop again against the same not-yet-reloaded `sections` state (still holding
   `tmp-` ids for newly-added items), inserting a second `section_items` row for each new item.
   This is almost certainly what happened, given bug #2 below — no confirmation meant the natural
   reaction to "did that work?" is to click again. Fixed: the button now disables + shows
   "Saving…" for the duration, guarded by an `isSaving` flag.
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

## If a box's text ever looks misaligned later

Only the milk_tea box's coordinates were rigorously re-verified pixel-by-pixel (the rest passed
a visual click-through, not a precision re-measure). Re-measure via PIL color-boundary scan on
the source PNG (see `board-renderer.js` `BOARD_TEMPLATES`) rather than eyeballing new coordinates.

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
  `migration_005_edit_history.sql`. All 7 have been run on the live DB.
- The **section/box layout** is NOT freeform — it's 3 fixed-design PNGs with named content boxes
  at exact coordinates. Don't reintroduce a generic drag-and-drop *layout* builder, that was
  explicitly rejected in favor of matching the real TV designs. **Board photos are the one
  deliberate exception** — freeform upload/drag/resize, rendered as their own layer strictly
  between the background and the item-text layer so a photo can never cover text.
- `admin/js/board-renderer.js` is the single source of truth for template box coordinates,
  font-size auto-shrink, and per-section row spacing (`sections.extra.line_spacing`).
- `admin/js/supabase-client.js` holds shared helpers used across every admin page: session
  gating, edit-history read/write/render, `warnOnUnsavedChanges`, and `diffItemFields`.
