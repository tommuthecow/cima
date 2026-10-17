# Cima

Beli-style ranking for movies and TV shows: pick a bucket, compare titles, and get a personal ranked list.

## Getting Started

```bash
npm install
npx prisma generate
npx prisma migrate deploy   # or: npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: set `TMDB_API_KEY` in `.env` for live search (falls back to built-in seed titles). Auth uses NextAuth — configure providers via env vars as needed for your setup.

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production
- `npm run lint` — ESLint
