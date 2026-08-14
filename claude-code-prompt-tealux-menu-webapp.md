# Prompt for Claude Code — Tealux Menu Board Employee Web App

## Context
I have an existing live static site (tealuxcafetampa.com) — plain HTML/CSS/vanilla JS, no build step, deployed on Netlify (uses Netlify Forms for the contact form). I'm attaching that site's current `index.html` as a reference for the existing structure/style — do not restructure or rewrite it, just add to it.

I want to add an employee-only, login-gated section to this SAME repo/site (no new domain, no new deploy target) with two tools:
1. **Item Management** — a product catalog (modeled on Shopify's product list/detail UI) where employees add, edit, remove, and duplicate menu items with full details.
2. **Build Menu Display** — a menu board editor that pulls items from that catalog and arranges them into styled boards, which export as PNG files to load onto the TVs via USB.

I have a working standalone HTML/JS prototype of the board-building canvas renderer (themes, auto-compacting layout, photo grid, featured items, marketing tags) that I'll drop into the project folder as a reference — reuse its rendering logic rather than rebuilding it from scratch. It's plain HTML/JS/canvas, no framework, matching the main site's stack.

Bonus: the main site's own "Menu" section is currently a static hand-typed list with no prices. Once Item Management exists, that public menu section could eventually pull from the same catalog too — not required for this build, just worth keeping in mind architecturally.

## Project setup
- **Same repo as the existing site** — no new git repo, no new Netlify site, no new domain
- Add a new `/admin/` directory: plain HTML/CSS/vanilla JS pages, no build tooling, matching the existing site's stack exactly
- Backend: Supabase (Postgres + Auth + Storage) — this is a hosted service, not a second deployed site
- No public sign-up — employee accounts only, created manually in Supabase
- Security note: since `/admin/` pages are still technically static files on a public host, the real security boundary is Supabase's auth + row-level security policies on the data itself, not the page being hard to find. Unauthenticated requests to the database must be rejected regardless of whether someone reaches an `/admin/` HTML file directly.

## Auth
- Supabase Auth, email/password or magic link
- Simple session-based login gate — no route should be reachable without an authenticated session
- Single role for now (any logged-in employee can view/edit everything)

## Database schema (Supabase)
- `items` — id, name, description, price, status (active | sold_out), tag (none | new | best_seller | limited), featured (bool), category, sort_order, created_at, updated_at
- `item_images` — id, item_id (FK), storage_url, sort_order, is_primary (bool)
- `boards` — id, name, width, height, theme (jsonb: bg/card/border/accent/text colors), updated_at
- `sections` — id, board_id (FK), name, style (list | featured | photo-grid), section_image_url, sort_order
- `section_items` — id, section_id (FK), item_id (FK), sort_order — links items into sections/boards without duplicating item data

Photos go in Supabase Storage, referenced by URL — not stored as base64 in the database.

## Pages (all under /admin/ in the existing repo)
1. **/admin/login.html** — email/password or magic link auth
2. **/admin/items.html** — item catalog list view: thumbnail, title, price, status, in a table like Shopify's product list. "Add item" and "Duplicate" actions at the top.
3. **/admin/item.html?id=...** — item detail page, Shopify-style split layout: title/description/price on the left, a right sidebar with status (Active/Sold Out), category, tag, and the ★ featured toggle. Multi-image gallery, reorderable, one marked primary.
4. **/admin/boards.html** — dashboard listing boards (Screen 1/2/3, add new), last-edited timestamp
5. **/admin/board.html?id=...** — the editor: pick items from the catalog into sections, arrange sections on the board, live canvas preview (reuse the prototype's rendering engine), "Download PNG" export button

Every page under `/admin/` (except login) should redirect to `/admin/login.html` on load if there's no valid Supabase session.

## Important behavior notes
- Editing an item's price/name/photo in Item Management should update it everywhere it's placed across boards — items are referenced, not copied, into sections
- The canvas export must stay pixel-exact to whatever resolution the board is set to (1920×1080, 4K, vertical, or custom) — this file gets loaded straight onto a USB drive for a TV, so it can't be approximate
- Auto-compacting layout logic from the prototype (shrinking font size / splitting into columns when a section has too many items, so nothing overflows or leaves visible gaps) needs to carry over as-is

## What I'll provide
- The existing site's `index.html` (for reference/context — don't modify its structure)
- The standalone HTML prototype (canvas rendering + auto-compact logic + theme system) as a reference implementation
- Real menu data already extracted from our current PowerPoint boards, for seeding/testing

## Out of scope for this build
- Toast POS integration (planned as a later phase — manual pull-and-review flow, not live sync)
- DoorDash/Uber Eats data sources (ruled out — those platforms show marked-up delivery pricing, not real in-store prices)
