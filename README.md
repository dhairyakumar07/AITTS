# AITTS — All India Test Series

A modern online examination platform with Student and Host/Admin roles.

## Stack

- Next.js App Router + TypeScript
- PostgreSQL (Neon in production)
- `pg` connection pool with SSL
- bcrypt password hashing
- JWT session cookies with `jose`
- Zod validation
- Responsive CSS UI with light/dark themes
- Lucide icons

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required production environment variables include `DATABASE_URL` and `SESSION_SECRET`.

The student test payload intentionally excludes the answer key. Grading happens server-side after submission.
