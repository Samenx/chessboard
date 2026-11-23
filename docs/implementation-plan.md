# Implementation plan

The repository audit found a working small product whose key models are still too flat for the requested learning experience. Work will proceed in small migrations that keep the current catalogue, lessons, accounts, and orders readable.

## Priorities

1. **Trust and learning correctness:** (started) filter paid course content at the API, separate real completion from navigation, and establish a real validated move tree.
2. **Data foundation:** introduce ordered additive migrations and versioned page/block/exercise schemas while preserving legacy JSONB lesson content.
3. **Authoring and study flow:** extract the large React module, make course overview and authoring workflows coherent, and add first-class pages, block editing/reordering, previews, drafts, and safe deletes.
4. **Design and language:** unify light/dark design tokens, then complete English/Arabic translations and direction-aware layouts.
5. **Marketplace and administration:** provide free enrollment, block paid access until server-verified provider payment exists, add access checks and settings for branding.
6. **Quality:** add unit, integration, and workflow coverage as each capability lands, then run the complete regression suite.

## Phases

### A. Foundation and audit — complete

- Recorded the baseline and limitations in `docs/technical-audit.md`.
- Added a chess.js-validated branch tree, visual authoring, student play, feedback, explanations, reset, and backward decision navigation.
- Filtered unowned paid lesson payloads from catalogue API responses.
- Added a transactional migration ledger, free-course enrollment, and a distinct legacy `test_paid` order status. New simulated orders have since been disabled.
- Added a Node test command with chess and access-projection tests.
- Added safe lesson deletion and persistent reader-aware theme selection.

### B. Access, migrations, and course model — in progress

- Applied ordered schema migrations without replacing `db/schema.sql` or deleting existing rows.
- Filtered unowned paid content at the API boundary; review remains for future endpoints.
- Added the first free-enrollment route and records.
- Added validated English/Arabic course language metadata and exposed it in the course overview.
- Added admin-controlled platform name, logo, primary color, and a live settings preview while preserving the existing hero-image control.
- Added instructor course creation and ownership: instructors can see the published catalogue and their own drafts, and can manage only courses they created; administrators retain global course controls.
- Added additive migration `005_course_ownership.sql` and a matching schema declaration for `books.created_by`; legacy courses remain administrator-managed.
- Kept platform brand settings and user-role management administrator-only.
- Added versioned first-class lesson page storage with migration `007_lesson_pages.sql`, an additive backfill from existing JSONB sectors, compatibility reads, and transactional dual-writes. Paid-content projections hide the new page payload too.
- Remaining: instructor profile metadata, richer multi-block page editing in Studio, and a broader authorization review.

### C. Chess exercises and lesson content

- Validate FEN, legal SAN, branching, and terminal positions with chess.js.
- Persist versioned exercise trees and test incorrect, accepted, automatic, reset, and review paths.
- Add an author-facing visual tree editor and a student exercise renderer.

### D. Authoring and student experience — in progress

- Split `src/main.jsx` by product area and centralize API behavior.
- Added explicit per-lesson completion, saved sector/page position, resumable lesson selection, and course completion based on distinct completed lessons.
- Added persisted per-exercise completion on enrolled lessons, with idempotent server updates and a saved completion indicator in lesson page navigation; solving an exercise remains separate from marking the lesson complete.
- Added transactional chapter and lesson reorder endpoints with exact-ID validation, plus up/down controls in Studio.
- Added a collapsible chapter and lesson table of contents to the study reader, with current lesson state, completion marks, direct lesson navigation, and Arabic label support.
- Existing authored sectors act as ordered first-class lesson pages and support editing, deletion, and explicit saving. The page model supports multiple blocks, while Studio currently authors one block per page.
- Remaining: broader student UX, authoring autosave/error states, multi-block page editing, and a full workflow test suite.

### E. Design system and bilingual interface — in progress

- Added an English/Arabic catalog foundation, persistent language selection, document `lang`/`dir`, RTL layout rules, and explicit LTR chessboard/notation regions.
- Translated core navigation, home, account, library, and selected lesson controls; most marketplace and instructor screens still need complete translation coverage.
- Remaining: finish translation coverage and verify both languages throughout desktop and mobile flows.

### F. Marketplace, branding, and release quality

- Add direct free enrollment and enforce paid access server-side.
- Keep paid checkout unavailable until a real provider can verify payment server-side; never grant course access from a client or test checkout.
- Add controlled global appearance settings and preview.
- Run build, unit, API, access-control, and end-to-end regression checks.

## Decisions made from the existing project

- Keep React, Vite, chess.js, react-chessboard, Node, and PostgreSQL; their current versions build and support the required domain.
- Use chess.js as the sole authority for legality and position state.
- Model a move tree as versioned JSON with server-side semantic validation first; this avoids a premature graph-table migration while ensuring branches are real and testable. Revisit storage only if analytics or collaborative editing requires per-node relational queries.
- Introduce a migration ledger before changing the database structure. Existing rows remain the compatibility baseline.
- Do not create simulated successful paid orders. Keep historical `test_paid` orders readable, and only add purchases after a provider confirms payment server-side.
- Scope instructor mutation rights to their own courses using `books.created_by`; administrator privileges remain global, and existing rows with no creator remain manageable by administrators.
- Store lesson pages in `lesson_pages` with a schema version and ordered JSONB blocks. Backfill each legacy content block into its own page, keep `lessons.content` as a compatibility mirror, and avoid destructive changes to existing lesson data.

## Input needed

No product or data-model decision blocks the foundation work. Before integrating a real payment provider, the owner will need to select the provider, merchant account, and supported currency/country policy; no real payment integration is assumed in this implementation sequence.
