# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The **frontend** of "Second Home", a hostel management system (FYP). It is a Next.js 16
(App Router) + React 19 + TypeScript app, styled with Tailwind v4 and shadcn/ui. It lives
in a monorepo: the Express/PostgreSQL backend is the sibling `../backend`, and the UI talks
to it over HTTP at `NEXT_PUBLIC_API_URL` (default `http://localhost:5000/api/v1`).

The app is feature-complete and wired to the real backend (see `DEMO_GUIDE.md` for the
running/testing routine and demo login accounts). Work here is verification and refinement,
not greenfield building.

## Commands

```bash
npm run dev      # dev server (Turbopack) on http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint (next/core-web-vitals + next/typescript)
```

There is **no test runner** configured — `lint` and `build` are the only automated checks.
To run the full stack locally, the backend and Postgres must also be up (see `DEMO_GUIDE.md`
Part 0). Set the API base in `.env.local` (`NEXT_PUBLIC_API_URL`).

- TypeScript is `strict`; path alias `@/*` → `src/*`.
- `next.config.ts` pins the Turbopack workspace root to this app (the monorepo has multiple
  lockfiles) and pre-optimizes `lucide-react` / `recharts` barrels.

## Architecture

### HTTP layer — `src/lib/http.ts` (read this first)

All network access goes through one client. Key behaviors that callers rely on:

- **Envelope unwrapping**: the backend returns `{ success, message, data }`; `request()`
  returns `data` directly (or throws). Callers never see the envelope.
- **Auth + refresh**: bearer token is read from `localStorage` (`sh_access_token` /
  `sh_refresh_token` via the SSR-safe `tokenStore`). On a `401` it transparently calls
  `/auth/refresh-token` **once**, retries, and clears tokens if that fails.
- **`ApiError`**: typed error with `status`, field-level `errors[]`, and a machine-readable
  `code` (e.g. `EMAIL_NOT_VERIFIED`). Feature hooks catch these and surface `.message` via
  toasts.
- **`unwrapList<T>(data, key)`**: list endpoints return *either* a bare array *or*
  `{ <key>: [...], ...pagination }`. Always normalize with this. Likewise many get-by-id
  endpoints return `{ entity }` *or* a bare entity — callers defensively unwrap both
  (`d && "entity" in d ? d.entity : d`).
- Use `{ isForm: true }` for `FormData` uploads, `{ auth: false }` for public endpoints.

### Feature modules — `src/lib/features/<feature>/`

Each domain (auth, students, rooms, fees, allocation, users, visitors, support, mess,
announcements, attendance, staff, assets, amenities, reports, public) is a self-contained
module. Two shapes exist; both are fine:

- **Single file**: `index.ts` holding the `<feature>Api` object, types, and hooks.
- **Split**: `api.ts` (raw `http` calls + input types), `types.ts`, `use<Feature>.ts`
  (client hooks). Larger features use this.

Convention: `*Api` objects are thin wrappers over `http`. Hooks (`useX`) wrap them with
`useAsync` for reads, local `busy`/`submitting` state for writes, `sonner` toasts for
success/error, and `refetch()` after mutations. Page components consume hooks, not the API
objects directly.

### Read helper — `src/lib/useAsync.ts`

Fetch-on-mount with `{ data, loading, error, refetch, setData }` and an `{ enabled }` gate
(used to chain dependent queries, e.g. resolve the student's own record id, then load that
record's documents). Pass a stable `deps` array (often `[JSON.stringify(params)]`).

### Auth & roles

- Reducer-based session in `src/lib/features/auth/` (`authContext.ts`, `authReducer.ts`,
  `useAuth.ts`). `AuthProvider` bootstraps the session on first mount by calling
  `/auth/profile` if a token exists. (Written as `.ts` using `React.createElement` to avoid
  JSX in a non-`.tsx` file — follow this if editing it.)
- `useAuth()` exposes `user`, `role` (`user.role.name`), `status`, and
  `login`/`register`/`verifyEmail`/`resendOtp`/`logout`/`updateProfile`. Registering =
  applying for a room; verifying email also returns a full session (auto-login).
- Roles are `admin | warden | student` (backend `staff` maps to the warden area). `roleHome()`
  and `src/lib/nav.ts` (`NAV`, `ROLE_META`) define each role's landing page and sidebar.
- `RoleGuard` (`src/components/auth/role-guard.tsx`) is a **client-side** guard used in each
  dashboard layout — it only keeps the UI honest (redirects, no dashboard flash). The
  **backend is the source of truth** and rejects unauthorized API calls regardless.

### Routing & layout (App Router, `src/app/`)

- Public/marketing: `/` (landing), `/login`, `/register`, `/verify`, `/apply`.
- Three dashboard areas: `/admin`, `/warden`, `/student`. Each `layout.tsx` wraps children in
  `RoleGuard allow={[...]}` + `DashboardShell` (sidebar + header from `nav.ts`).
- `src/app/layout.tsx` mounts global `Providers` (theme → auth → tooltip) and the `sonner`
  `Toaster`.

### Components

- `src/components/ui/` — shadcn/ui primitives + project-specific composites (data tables,
  charts, sidebars, pickers). shadcn config: `components.json`, style `base-nova`, lucide
  icons, CSS vars in `src/app/globals.css`.
- `src/components/{dashboard,marketing,dialogs,journey,brand,auth}/` — higher-level pieces.
- `src/lib/mock.ts` holds **presentation-only** mock data for marketing/dashboard visuals;
  it is not used as a substitute for real API data on functional pages.
