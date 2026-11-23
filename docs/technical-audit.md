# Technical audit

Audit date: 2026-11-23

## Verified baseline

- Frontend production build: `npm.cmd run build` succeeds with Vite 6.4.6.
- Backend syntax: `node --check server/index.js` and `node --check db/setup.js` succeed.
- API health: the running API reports PostgreSQL connected.
- Course catalogue: `GET /api/books` returns HTTP 200.
- Installed core versions: React 18.3.1, Vite 6.4.6, chess.js 1.4.0, react-chessboard 4.7.3, pg 8.23.1.
- The initial audit found no test script or test files. A Node test runner now runs 24 tests for exercise rules, lesson access, localization, progress calculation, reordering validation, metadata validation, media signatures, and branding validation.
- Registration, purchase, and authoring flows were not exercised against the connected database because the project has no safe cleanup path for test records.

## Current implementation

The browser application is concentrated in `src/main.jsx` and a single large `src/style.css`. The React `App` owns navigation, API calls, authentication state, catalogue, cart, checkout, library, progress, and chess position state. `AuthorStudio`, `LessonSectors`, and `LessonContentBlock` are embedded in the same module. The interface has a `dark` state; the reader hardcoded dark surfaces, which caused a mismatch on navigation. The first theme fix now persists the choice and gives the reader a light palette as well.

The backend is a single Node HTTP server in `server/index.js`. It combines route matching, authentication, validation, SQL, file upload, and static serving. PostgreSQL access uses parameterized SQL. The schema in `db/schema.sql` is applied by the setup script and has additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements, but there is no ordered migration history.

## What works today

- React/Vite app and Node API start/build in the current environment; a pre-existing API instance is connected to PostgreSQL.
- Passwords are stored using scrypt with per-user salts; session tokens are random and stored as hashes in the database.
- Admin checks exist on course mutation, category creation, media upload, and user role changes.
- Courses/books, chapters, and lessons can be created and edited. Lessons persist a JSONB array of content blocks.
- The position editor uses chess.js to build FEN positions; line parsing and board moves also use chess.js.
- The marketplace has a persistent cart, orders, purchases, and library access. Checkout previously created a `paid` order directly in the backend. It now requires `PAYMENTS_MODE=beta` and writes `test_paid`, distinct from provider-confirmed `paid` orders.
- Free enrollment now has a dedicated table and authenticated API route; the storefront action and library ownership use that enrollment record.
- Student progress now stores the last lesson/page and per-lesson completion separately. Completion is explicit, idempotent, and determines the course percentage; free enrollments satisfy the same ownership check as purchases.
- Courses now store an `en` or `ar` language, defaulting existing records to English, and the API returns the metadata for course overview display.

## Partial, weak, or missing behavior

- Lessons have a text field and a flat ordered block list called “sectors.” Studio can reorder those sectors as pages and students can navigate and resume them, but pages are not a first-class database model and rich-text editing is absent.
- A line block is a single mainline. The trainer expects one SAN move at each student turn; it cannot represent alternate accepted moves or branch-specific paths.
- Incorrect line feedback names the expected SAN move, revealing the answer. Explanations are attached to line steps but are not a real move-tree transition model.
- The course overview now exposes the description through “About this course,” course language, instructor display name, outcomes, chapter structure, enrollment/purchase action, and learner progress for owned courses. Instructor profiles and a more complete instructor bio are still missing.
- Instructor profile metadata beyond the existing author display name is not modeled yet.
- The branching engine has visual authoring and student play, but exercise completion is not yet saved as course progress; the old course progress model still records only a lesson index.
- Lesson and sector navigation saves a resume position without completing the lesson. Students explicitly mark lessons complete, and cannot finish the course until each lesson is complete. Exercise-specific completion is not yet connected to this course progress model.
- Chapter/lesson authoring is a multi-screen custom form. Lesson deletion and chapter/lesson reordering now have admin-only routes; route-level integration tests and chapter deletion/reordering semantics remain to be verified more broadly.
- The frontend still has substantial inline English copy. A small English/Arabic catalog, persistent language selection, document language/direction, and RTL/LTR layout rules now exist, but most marketplace and instructor copy remains untranslated and has not had full RTL usability verification.
- Global settings now cover the hero image and platform name, logo, and primary color. Theme choice is visitor-persistent and shared across light/dark surfaces, but the design token system and appearance coverage still need consolidation.
- The initial audit found that `/api/books` exposed full paid lesson payloads. The first implementation slice now filters lesson text, PGN, FEN, and content blocks for viewers without ownership; a live API check confirmed five unowned paid courses returned no lesson payload. Course API access still needs a broader authorization review as new lesson/page endpoints are added.
- `server/index.js` accepts a broad JSON body limit and has no centralized schema validation or general API error boundary. Uploads now check common media signatures against the claimed MIME type and responses set `X-Content-Type-Options: nosniff`; files are not decoded by a full media parser and upload security needs further review.

## Preserve

- Existing PostgreSQL records and the current book/chapter/lesson tables.
- Existing React, Vite, chess.js, and react-chessboard dependencies unless a concrete need justifies replacement.
- Parameterized database queries, hashed session tokens, and the existing authoring and study-line workflows while they are migrated.
- Legacy lessons and their `content` blocks; new models must remain readable alongside them during migration.

## Architectural risks and direction

1. **Application concentration:** extracting API, chess, lesson rendering, authoring, and localization modules is prerequisite to a maintainable redesign.
2. **No migration ledger:** additive SQL migrations need an ordered runner and a migration table before introducing first-class lesson pages or completion events.
3. **Unvalidated JSONB:** content blocks and future move trees need versioned schemas and server-side validation before persistence.
4. **Course access:** the API response itself must filter paid lesson content by enrollment/ownership, not rely on hidden frontend routes.
5. **Simulated checkout:** orders must remain explicitly test-only until a provider confirms payment server-side; frontend state cannot authorize access.
6. **Progress meaning:** lesson, page, and exercise completion need separate events and a stated completion rule; URL/navigation alone cannot complete learning work.

No data migration or destructive database operation was performed during this audit.
