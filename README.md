# Chessboard Press

## Connect your pgAdmin PostgreSQL database

pgAdmin is the management app; the PostgreSQL server registered inside pgAdmin is what this project connects to. The app's database password is the PostgreSQL role password (often the `postgres` role), not your pgAdmin master password.

1. In pgAdmin, confirm the server is running and the database is named `chessboard_press`.
2. Copy `.env.example` to `.env` in this project folder.
3. Set `DATABASE_URL` in `.env` to your server details. For the common local setup:

   ```env
   DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/chessboard_press
   ```

   Replace `postgres` if your PostgreSQL login role differs. If the password contains characters such as `@`, `:`, `/`, `#`, or `%`, URL-encode those characters. For example, `@` becomes `%40`.

4. In a terminal opened at this project folder, run:

   ```sh
   npm install
   npm run db:setup
   npm run dev
   ```

5. Open the Vite URL printed by `npm run dev`. The top bar shows whether the API can reach PostgreSQL.

`db:setup` creates the relational tables and inserts the sample course catalogue only when the `books` table is empty. It does not delete existing data. The app reads books and orders from PostgreSQL, writes course drafts and lessons there, and creates pending orders there. Cart contents remain in the browser until an order is created. Sign-up and sign-in use PostgreSQL accounts with scrypt-hashed passwords and opaque, HTTP-only server sessions.

Local checkout runs in **Beta test mode** (`PAYMENTS_MODE=beta`). It can mark an order as test-paid and grant the books to the signed-in account's library without collecting card details or moving money. This test payment endpoint is not a live payment integration and must be disabled or replaced before deployment.

## Security and payment status

The database password is read only by the Node server and must never be placed in frontend code or a `VITE_` variable. The current authoring endpoints are intended for local development. Add real authentication and server-side instructor/admin authorization before exposing this API to the internet. Orders remain `pending_payment`; no payment is collected and no library access is granted. A payment provider webhook must verify payment before a purchase/entitlement flow is added.

## Database tables

`books`, `chapters`, `lessons`, `move_annotations`, `orders`, `order_items`, and `payment_events` store course content and commerce records. Schema changes are in `db/schema.sql`.
