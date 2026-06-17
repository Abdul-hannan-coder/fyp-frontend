# Second Home — Resident Booking Journey (e-commerce flow)

This documents the **full room-booking user journey** as implemented in the frontend,
wired to the real backend (spec 002). It is the "browse → pick → apply → approve →
verify → pay → confirm" lifecycle, modelled like an e-commerce checkout.

> Backend reality that shapes the order of steps:
> - A bookable room is published as a **RoomPackage** (room + priced amenity incentives).
> - `register` stores the chosen `selected_package_id` + a Student profile, but the
>   account is **pending admin approval** — login is gated on `is_approved`.
> - **Admin approval auto-reserves**: it creates an Allocation (`pending_payment`) and a
>   Payment for the package price. So the payable only exists *after* approval.
> - Login returns `requires_email_verification`; the resident verifies via OTP, then pays
>   and uploads proof. Admin verifies the payment to finish.

---

## The journey, step by step

| # | Step | Who | Route | Backend |
|---|------|-----|-------|---------|
| 1 | **Browse rooms** with filters (price, block, occupancy, search, sort) | Public | `/rooms` | `GET /public/packages` |
| 2 | **Select a room** → "Book this room" carries the package into the form | Public | `/rooms` → `/apply?package=<id>` | — |
| 3 | **Apply**: account + resident profile + guardian; submits the selection | Public | `/apply` | `POST /auth/register` (`selected_package_id` + `student{}`) |
| 4 | Account is created → **pending admin approval** screen | Public | `/apply` (success) | — |
| 5 | **Admin approves** the applicant → auto-reserves room + raises payment | Admin | `/admin/users` | `PATCH /auth/users/:id/approve` |
| 6 | **Login** → routed to verify because email isn't verified yet | Resident | `/login` → `/verify` | `POST /auth/login` (`requires_email_verification`) |
| 7 | **Verify email** with the 6-digit OTP (auto-emailed on arrival) | Resident | `/verify` | `POST /auth/resend-otp`, `POST /auth/verify-email` |
| 8 | See **reserved room + amount due**, transfer, then **upload proof** (the student's confirm action — `POST /fees/payments` is admin-only) | Resident | `/student/booking`, `/student/fees` | `GET /fees/payments/my`, `POST /fees/payments/:id/proof` |
| 9 | **Admin reviews proof & verifies payment** (View proof → Verify → status `paid`) | Admin | `/admin/finance` | `GET /fees/payments/:id/proofs`, `PATCH /fees/payments/:id/verify` |
| 10 | Room **confirmed** — resident sees it in My Room | Resident | `/student/room` | `GET /allocations/my` |

Progress is shown end-to-end by the **Stepper**: `Apply → Approval → Verify → Pay → Move in`.

---

## What was added / changed in the frontend

- **`/rooms`** (new) — e-commerce catalogue of published packages with client-side
  filters (search, block, occupancy, max-price slider, available-only, sort) and
  "Book this room" deep-links to `/apply?package=<id>`.
  - `src/app/rooms/page.tsx`
  - `src/lib/features/public/index.ts` — `publicApi.packages()`, `packageById()`,
    `usePublicPackages()`, `usePublicPackage()`, package types.
- **`/apply`** — reads `?package=`, shows the selected-room summary, and now captures the
  resident profile (DOB, gender, city, department) + guardian, sending
  `selected_package_id` + `student{}` so approval can auto-reserve. Success screen now
  reflects **pending approval** (login after approval). Wrapped in `<Suspense>` for
  `useSearchParams`.
- **`/login`** — handles `PENDING_APPROVAL` (awaiting approval message) and routes to
  `/verify` when `is_verified` is false.
- **`/verify`** — auto-requests an OTP on arrival (none is sent at signup), updated stepper.
- **`/student/booking`** — shows the **selected package** while awaiting approval, then the
  reserved room + dues + pay + proof once approved; stepper reflects the real stage.
- **`/admin/finance`** — added **"Proof"** action on each pending payment to view the
  resident's uploaded proof before Verify/Reject.
- Landing CTAs (`/`, rooms section, site header) now point at `/rooms`.

## Demo data
`backend/scripts/seed-sample-data.js` publishes **one package per bookable room** (20),
so the browse page has a full catalogue to filter. Demo logins are in `DEMO_GUIDE.md`.

## How to demo the full loop
1. Open `/rooms`, filter, click **Book this room** on an available room.
2. Fill `/apply` with a **new** email + profile → submit → "pending approval".
3. Log in as **admin** (`admin@secondhome.app` / `Admin@123`) → `/admin/users` → approve the applicant.
4. Log in as the new resident → you're sent to `/verify` → enter the OTP (check email / backend logs) → land in `/student`.
5. Go to `/student/booking` → reserved room + amount due → **Pay & upload proof** (upload the receipt).
6. Back as **admin** → `/admin/finance` → **Proof** (view the receipt) → **Verify**. Payment flips to `paid` and the resident's room is confirmed.
