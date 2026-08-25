# barber-frontend

Vue SPA for the barbershop management app. Talks to [barber-backend](../barber-backend).

- **Architecture:** [`SPEC.md`](./SPEC.md) — read before building screens

## Setup

```bash
cd barber-frontend
cp .env.example .env   # VITE_API_URL, VITE_SHOP_TIMEZONE
npm install
npm run dev            # http://localhost:5173
```

Requires the API running (`barber-backend` on `VITE_API_URL`, default `http://localhost:3000/v1`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest |
| `npm run typecheck` | `vue-tsc` only |

### Env

| Variable | Example | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/v1` | Backend `/v1` base |
| `VITE_SHOP_TIMEZONE` | `America/Sao_Paulo` | Must match backend `SHOP_TIMEZONE` |

## Packages

| Package | Path | Notes |
|---|---|---|
| `@barber/bcomponents` | `packages/bcomponents` | Vendored UI kit (renamed from bcomponents) |
| `@barber/bcomponents-icons` | `packages/bcomponents-icons` | Icon sprites / SVGs |

## Stack

Vue 3 · Vite · TypeScript · Vue Router · Pinia · TanStack Query · Zod · Luxon · `@barber/bcomponents`

App shell is live (`src/`). Domain modules still show “Em breve” placeholders until their slices land.
