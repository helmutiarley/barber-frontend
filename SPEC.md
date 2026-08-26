# Barbershop Frontend — Architecture Spec

> Living document. Read this before any Vue work. This file defines **how** the SPA is built.

## 1. Stack

| Concern       | Choice                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Runtime       | Vue 3 (Composition API + `<script setup>`)                             |
| Language      | TypeScript (strict)                                                    |
| Bundler       | Vite                                                                   |
| Routing       | Vue Router 4                                                           |
| Server state  | TanStack Query (Vue Query) — fetches, cache, mutations                 |
| Client state  | Pinia — auth session, UI prefs, cash-register banner, theme            |
| UI kit        | In-house — `src/ui` (B* components, `--b-*` tokens, icon set)          |
| Forms         | vee-validate + Zod (same shapes as backend schemas where practical)    |
| HTTP          | `fetch` wrapper (`src/lib/api.ts`) — no axios                          |
| Tests         | Vitest + Vue Test Utils + Testing Library                              |
| i18n          | Not in v1 — UI copy in Portuguese (pt-BR) hard-coded                   |

Money from the API is **integer cents**. Display with a shared `formatMoney(cents)` helper; never use floats for arithmetic.

Timestamps from the API are ISO-8601 **UTC**. Display and date pickers use the shop timezone from config (`VITE_SHOP_TIMEZONE`), matching backend `SHOP_TIMEZONE`. Do not send a per-request `tz` query param.

## 2. Layers

```
View (page / route component)
  → feature composable / query hooks   (orchestrate API + local UI state)
  → api modules                        (typed HTTP calls per backend module)
  → api client                         (auth header, refresh, error mapping)
  → barber-backend `/v1`
```

**Dependency rule:** pages may import composables and UI components; composables may import api modules; api modules only import the shared client. No page talks to `fetch` directly.

### 2.1 Pages — `src/pages/<module>/`

- One route → one page SFC (or a thin page that composes feature views).
- Own the URL (query params for filters/ranges), page title, and role gate via router meta.
- No raw `fetch`. Call composables / `useQuery` / `useMutation`.

### 2.2 Features — `src/features/<module>/`

- Domain UI for a module: forms, tables, agenda day view, payment splitter, etc.
- Export composables (`useBookAppointment`, `useCashSession`) and presentational pieces used by pages.
- Map API DTOs → view models when the screen needs derived fields (e.g. status chip color, money strings).

### 2.3 API — `src/api/<module>.ts`

- One file per backend module. Functions named after the use case (`listAppointments`, `completeAppointment`).
- Input/output types live next to the calls or in `src/api/types/` generated/hand-kept from backend DTOs.
- Throw typed `ApiError` (`code`, `message`, `status`, optional `fields`) — never swallow.

### 2.4 App shell — `src/app/`

- Router, Pinia stores, QueryClient provider, layout (sidebar/topnav), auth bootstrap, toast host (`BToast`), global error → toast mapping.

## 3. Folder Structure

```
src/
├── main.ts
├── App.vue
├── app/                    # router, providers, layouts, guards
├── api/                    # one file per backend module + client
├── features/               # module UI + composables
├── pages/                  # route-level SFCs
├── components/             # shared app chrome (not the UI kit)
├── composables/            # cross-module hooks (useMoney, useShopTime)
├── stores/                 # Pinia: auth, ui, cashRegister
├── lib/                    # api client, money, dates, constants
├── styles/                 # reset + app shell variables
└── ui/                     # in-house UI kit (B* components, tokens, icons)
```

Tests mirror `src/` under `tests/` (or co-located `*.spec.ts` — pick one and stick to it; default: `tests/` mirroring backend).

Modules (build order, same as backend): **app-shell → auth → barbers → services → appointments → clients → payments → cash-register → expenses → commissions → products → reports.**

Each module has a spec in [`specs/`](./specs/) (`specs/NN-<module>.md`). Foundation/shell is [`specs/00-app-shell.md`](./specs/00-app-shell.md). Read the module spec **and** the matching `barber-backend/specs/NN-*.md` before building a screen.

## 4. Routing & Auth

- Routes declare `meta: { roles?: UserRole[], guest?: boolean, title: string }`.
- Global `beforeEach`: if route needs auth and there is no session → login with `?redirect=`; if roles mismatch → 403 page.
- Resource-level rules (barber’s own agenda, client’s own booking) are enforced by the API; the UI still hides actions the role cannot perform (don’t rely on 403 as the only UX).
- Access token in memory (Pinia); refresh token in `httpOnly` is **not** available from a pure SPA — store refresh in `localStorage` (acceptable for this internal tool) or a secure cookie set by a BFF later. Refresh on 401 once, then logout.
- Identity for API calls comes only from the Bearer token. Never put `userId` / `role` in mutation bodies unless the backend schema explicitly allows a staff-supplied `clientId`.

## 5. UI Kit (`src/ui`)

- In-house and dependency-free. `main.ts` only imports `@/ui/tokens.css`; there is no setup call.
- Prefer kit primitives: `BButton`, `BInput`, `BInputArea`, `BSelect`, `BCheckbox`, `BSwitch`, `BDialog`, `BToast` + `useBToast`, `BLabel`, `BCard`, `BTabs`, `BSegmentedControl`, `BEmptyState`, `BSkeletonLoader`, `BCircleLoader`, `BIcon`, `BIconButton`, `BText`, `BDivider`.
- Do not re-implement buttons/inputs. App-specific composites (agenda grid, payment splitter) live in `features/` and compose the kit.
- Extending the kit means adding a component under `src/ui/components` and exporting it from the barrel; mirror the change into barber-crm's copy.
- Style with `--b-*` tokens only — no raw hex outside `src/ui/tokens.css`.
- Toasts for success/failure of mutations; `helper-text` carries field-level validation errors.

## 6. Data Fetching

- Lists and details: `useQuery` with stable keys `['appointments', filters]`.
- Mutations: `useMutation` + invalidate related keys on success.
- Optimistic updates only where rollback is trivial (e.g. toggle); appointment state transitions stay pessimistic (wait for server).
- Empty / loading / error: every list page has skeleton → empty state → error retry.

## 7. Forms & Validation

- Client Zod schemas mirror backend constraints (required fields, cents as int, email, date ranges ≤ 92 days for staff appointment lists).
- Show field errors from `VALIDATION_ERROR` `fields` when the server returns them.
- Disable submit while pending; don’t double-post payments or completes.

## 8. Cross-cutting UI Gates

Surfaced globally or at the point of action:

| Gate                         | UX                                                                 |
| ---------------------------- | ------------------------------------------------------------------ |
| Cash register closed         | Banner in shell for ADMIN/MANAGER; cash method disabled in forms   |
| No applicable commission rule| Warn on complete appointment; explain 409                          |
| Client cancel window         | Disable self cancel/reschedule; show “call the shop”               |
| Commission period closed     | Disable void payment / void sale that would touch closed entries   |

## 9. Role → Shell

| Role    | Primary home                         |
| ------- | ------------------------------------ |
| ADMIN   | Reports / today agenda               |
| MANAGER | Today agenda (reception)             |
| BARBER  | Own agenda + commissions statement   |
| CLIENT  | Book + my appointments               |

Nav items are role-filtered. CLIENT never sees cash, expenses, or staff admin.

## 10. Conventions

- Files: kebab-case; components `PascalCase.vue`; composables `useX.ts`.
- Routes: plural nouns matching API where sensible (`/appointments`, `/clients/:id`).
- Query params for filters (`from`, `to`, `barberId`, `status`) — shareable URLs.
- Commits: conventional (`feat:`, `fix:`, `chore:`); one module concern per PR when possible.

## 11. Definition of Done (per screen)

1. Route + role meta + page wired.
2. API module function(s) + query/mutation hooks.
3. Loading / empty / error states.
4. Actions hidden or disabled per role; server errors mapped to toast/inline copy.
5. Uses `src/ui` for kit-level UI.
6. Spec status updated when the slice ships.

## 12. Out of Scope (frontend v1)

- Native apps, PWA offline, i18n framework, Storybook for the app (kit already has stories upstream), CSV/PDF export, WhatsApp/notifications (backend dropped), BFF.
