# Continue From Here

Last worked on: 2026-08-14. Read this before doing anything else on the admin tool.

## Status: deployed, click-through tested, actively iterating

The admin tool is live at `tealuxcafetampa.com/admin/login.html` (unlisted on purpose — no
link from the public site; decided 2026-08-14, revisit only if Kha/Chao ask for a
bookmark-free way in).

Latest pushed commit: `c044060` — "Add a Preview All Boards page". Everything through that
commit is confirmed working DB-side (all 7 SQL files run, no errors) but **not yet click-tested
in the browser** for the newest features (inactive status, edit history, unsaved-changes
warning, Preview All page).

**Uncommitted local work as of now**: inline bulk-edit mode on `items.html` (see below) — not
yet committed or pushed.

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

## Built but not yet browser-tested (pushed in commits `3b509ea` and `c044060`)

- **Inactive item status** (`migration_004`) — excluded from board dropdowns and skipped by the
  renderer even if already linked to a board.
- **90-day edit history** (`migration_005`) — "Recent Changes" panel on `item.html`/`board.html`,
  human-readable summaries generated at save time, not raw diffs. What/when only, no per-person
  attribution (shared login, confirmed acceptable). "90 days" is a display filter, not deletion.
- **Unsaved-changes warning** — native browser dialog on both pages if you navigate away with
  unsaved edits. Board photos (save instantly on drag-end) don't count as unsaved.
- **`/admin/preview.html`** ("Preview All" button on the boards dashboard) — every board
  rendered side by side in one read-only view, for checking visual consistency across screens.

## Built 2026-08-14, NOT yet committed — inline bulk edit on items.html

New "Edit" button on the items table toggles every visible row into inline-editable cells
(name/category/price/status/tag), instead of opening each item individually. Key decisions:

- Editing is scoped to whatever's currently visible under the active search/filters — search,
  filters, and sorting are **locked** (disabled + a note shown) while editing, specifically to
  avoid the "did my edit get lost when the list re-filtered" confusion.
- Category is a plain dropdown of already-existing categories only — no "add new" inline (that
  stays exclusive to `item.html`'s fuller editor).
- "Save Changes" diffs each touched row against its original DB values (reusing `diffItemFields`,
  now hoisted into `supabase-client.js` so both `item.html` and `items.html` share it) and only
  writes + logs history for rows that actually changed.
- "Cancel" discards in-memory edits with no DB calls.
- Wired into the same `dirty`/`warnOnUnsavedChanges` pattern as the other pages.

**Not yet committed, pushed, or tested.**

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
