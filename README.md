# AITTS — All India Test Series

A standalone online test platform with Student and Host/Admin roles.

## Stack

- Next.js App Router + TypeScript
- SQLite + better-sqlite3
- bcrypt password hashing
- JWT session cookies with jose
- Zod validation
- CSS UI with purple/white light/dark themes

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

The database is initialized automatically on first server access.

### Demo accounts

- Host: `admin@aitts.local` / `AITTS-Admin-2026!`
- Student: `student@aitts.local` / `AITTS-Student-2026!`

Change/remove these before real deployment.

## Important production note

SQLite is intentionally used for local development and a small deployment. For a public high-concurrency deployment, move the same relational model to PostgreSQL and use a durable rate-limit/session store.

The answer key is never included in the student test GET response. Grading happens on the server.
