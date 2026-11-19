# Chess Arena

## Run locally

The app uses PostgreSQL. pgAdmin is the management app; connect it to a running PostgreSQL server first, then create a database named `chessboard_press`.

Create a `.env` file in the project folder:

```env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/chessboard_press
API_PORT=3001
API_HOST=127.0.0.1
PAYMENTS_MODE=beta
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

The initial local admin account is `admin@admin.com` with password `1234`. `db:setup` creates it only when the address is not already registered; it does not reset an existing account's password. Change this password before exposing the app beyond local development.

Only admins can open Admin Studio or use the server routes that create, edit, publish, delete books, upload media, change the hero image, and review user accounts. Regular signed-in users can create folders, save PGN lines, choose which color to play, and practice against automatic replies. A completed practice updates the line's review count.

## Database and payments

`db:setup` creates the relational schema and inserts the sample course catalogue only if the `books` table is empty. It does not delete existing data. Course content, user accounts, orders, saved lines, and hero image settings are stored in PostgreSQL. Cart contents remain in the browser until an order is created.

Local checkout can run in beta test mode (`PAYMENTS_MODE=beta`). It records a simulated payment and does not collect card details or move money. Replace or disable this test flow before deployment.
