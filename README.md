# Chess Arena

## Run locally

The app uses PostgreSQL. pgAdmin is the management app; connect it to a running PostgreSQL server first, then create a database named `chessboard_press`.

Create a `.env` file in the project folder:

```env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/chessboard_press
API_PORT=3001
API_HOST=127.0.0.1
```

Use the PostgreSQL role password, not the pgAdmin master password. URL-encode special characters in the password (for example, `@` becomes `%40`). Keep `.env` private; it is ignored by Git.

Install dependencies, initialize the schema and start the app:

```sh
npm install
npm run db:setup
npm run dev
```

Open the Vite URL printed by `npm run dev` (usually `http://localhost:5173`).

## Admin access

For a fresh database, set `ADMIN_EMAIL` and a private `ADMIN_PASSWORD` of at least 12 characters in `.env` before running `db:setup`. Setup creates that administrator only when no administrator exists and the address is not already registered. It does not reset passwords or promote existing accounts. Existing databases retain their current admin accounts.

Only admins can open Admin Studio or use the server routes that create, edit, publish, delete books, upload media, change the hero image, and review user accounts. Regular signed-in users can create folders, save PGN lines, choose which color to play, and practice against automatic replies. A completed practice updates the line's review count.

## Database and payments

`db:setup` creates the relational schema and inserts the sample course catalogue only if the `books` table is empty. It does not delete existing data. Course content, user accounts, orders, saved lines, and hero image settings are stored in PostgreSQL. Cart contents remain in the browser until an order is created.

Set `PAYMENTS_MODE=beta` only for local testing. Beta checkout creates `test_paid` orders and grants test access; it does not collect card details or take payment. Checkout is disabled when the setting is absent or set to another value. Real orders must be confirmed by a payment provider before they are marked `paid`. A book must have at least one lesson before checkout. Free courses use a separate enrollment flow. Orders, enrollments, library access, cart items, course progress, categories, and course content are stored in PostgreSQL. Guest cart items are also stored in PostgreSQL and move to the account when the user signs in.

`npm run db:migrate` applies ordered, transactional SQL migrations recorded in `schema_migrations`. `db:setup` also applies pending migrations after the existing idempotent schema script.
