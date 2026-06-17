# Second Home — Frontend Build, Test & Demo Guide

> **Read this first.** Your frontend is **already built**. All pages exist across the
> three roles (Admin, Warden, Student) and are wired to the real backend — no mock data
> in pages. So your job is **not** "create features from scratch." It is:
>
> **Verify each feature works → tick it off → move to the next → then run one clean demo
> for your supervisor.**
>
> Work through this top to bottom. Each feature has: where it lives, how to test it,
> what "passing" looks like, and the one line you say to your supervisor.

---

## Part 0 — Start everything (do this once per session)

Run these in **three terminals** (keep them open):

```bash
# Terminal 1 — Database (Docker)
cd ~/my-projects/fyp
docker compose up -d                 # starts hostel_db (Postgres, port 5432)

# Terminal 2 — Backend API
cd ~/my-projects/fyp/backend
npm run dev                          # http://localhost:5000  (API base /api/v1)

# Terminal 3 — Frontend
cd ~/my-projects/fyp/frontend
npm run dev                          # http://localhost:3000
```

**Health check** (Terminal 4, optional): `curl http://localhost:5000/health`

### Demo login accounts (all verified, approved, active)

| Role    | Email                       | Password     |
|---------|-----------------------------|--------------|
| Admin   | `admin@secondhome.app`      | `Admin@123`  |
| Warden  | `warden@secondhome.app`     | `Warden@123` |
| Student | `student@secondhome.app`    | `Student@123`|

> If logins ever stop working (DB reset, wiped data), recreate all three in one shot:
> ```bash
> cd ~/my-projects/fyp/backend && node scripts/create-demo-users.js
> ```

### How to test any page (the routine)

1. Open the route in the browser.
2. Watch for: page loads, **no red error**, real data shows (not blank/spinner forever).
3. Do the **one action** listed for that feature (create / approve / pay / etc.).
4. Confirm the change persists: **refresh the page** — the change is still there.
5. Tick the checkbox. Move on.

If a page breaks, open browser **DevTools → Console** + **Network** tab, find the failing
request (red), note the URL and status code, and tell me — that's a 5-minute fix.

---

## Part 1 — Feature checklist (test in this order)

The order matters: each step sets up data the next one needs. Follow it for the smoothest run.

### A. Public site & authentication

- [ ] **Landing page** — `/`
  Hostel marketing page: rooms, amenities, pricing, "Your home away from home".
  *Test:* scrolls cleanly, images/sections render, CTA buttons go to `/apply` and `/login`.
  *Say:* "This is the public site where prospective students discover the hostel."

- [ ] **Apply / Register** — `/apply` (and `/register`)
  New student submits an application.
  *Test:* fill the form with a **new** email → submit → you're sent to verify/login.
  *Say:* "A new resident applies here — it creates a pending account."

- [ ] **Verify email** — `/verify`
  OTP/email verification; on success it auto-logs you in.
  *Test:* the apply flow routes here; enter code → lands in the student dashboard.
  *Say:* "Email verification before the account is usable."

- [ ] **Login** — `/login`
  One unified login (no role tabs — the backend JWT decides the role).
  *Test:* log in as each of the 3 demo accounts → each lands on its own dashboard
  (admin → `/admin`, warden → `/warden`, student → `/student`).
  *Say:* "Single login — the system routes each user to the right dashboard by role."

- [ ] **Logout & route protection**
  *Test:* while logged out, try opening `/admin` directly → you're blocked/redirected to login.
  *Say:* "Routes are role-guarded — a student can't reach admin pages."

### B. Admin — setup & people (log in as Admin)

- [ ] **Admin dashboard** — `/admin`
  Overview stats (residents, occupancy, fee collection, open tickets).
  *Test:* numbers load from the API (donut/progress widgets, not fake line charts).
  *Say:* "The admin's at-a-glance view of the whole hostel."

- [ ] **Setup** — `/admin/setup`
  Configure base data: room types, blocks, fee structures, etc.
  *Test:* view existing config; create one item → it appears in the list.
  *Say:* "One-time configuration of the hostel's structure."

- [ ] **Users** — `/admin/users` and `/admin/users/[id]`
  List all users; open one to view/approve/activate.
  *Test:* open a pending applicant → **approve** them → status flips to approved.
  *Say:* "Admin approves new applicants and manages every account here."

- [ ] **Staff** — `/admin/staff`
  Manage wardens/staff records.
  *Test:* list loads; open/create a staff record.
  *Say:* "Staff and warden management."

### C. Allocation — putting a student in a room

- [ ] **Rooms (Warden)** — `/warden/rooms`
  Room inventory with occupancy/availability.
  *Test:* list loads; an available room is visible.

- [ ] **Allocations** — `/admin/allocations` (and `/warden/allocation`)
  Assign an approved student to an available room.
  *Test:* allocate the demo student to a room → student now shows a room; bed count drops.
  *Say:* "This is the core workflow — placing an approved resident into a physical bed."

- [ ] **Student room view** — `/student/room`  (log in as Student)
  *Test:* the room you just allocated shows up here for the student.
  *Say:* "The student instantly sees their assigned room."

### D. Student daily-life features (log in as Student)

- [ ] **Student dashboard** — `/student`
  Personal overview (room, fees due, announcements).
  *Test:* loads with the student's real data.

- [ ] **Booking** — `/student/booking`
  Room booking/request flow.
  *Test:* page loads, submit a request.

- [ ] **Fees** — `/student/fees`
  View invoices / dues, pay or view payment history.
  *Test:* fee/invoice list loads; a "pay" action updates status.
  *Say:* "Students see their dues and payment history."

- [ ] **Mess** — `/student/mess`
  Meal plan: current plan, billing, menu; subscribe / change plan.
  *Test:* view menu + plan; subscribe to a plan → "my plan" updates.
  *Say:* "Meal-plan subscription and the weekly menu."

- [ ] **Attendance & Leave** — `/student/attendance`
  Attendance summary + leave balances; apply for leave.
  *Test:* summary loads; apply for leave (pick a leave type) → request appears.
  *Say:* "Attendance record plus a leave-application workflow."

- [ ] **Visitors** — `/student/visitors`
  Register/expect a visitor.
  *Test:* add a visitor entry → it shows in the list.
  *Say:* "Students pre-register visitors for gate security."

- [ ] **Support tickets** — `/student/support`
  Raise a maintenance/support complaint.
  *Test:* create a ticket → it appears with "open" status.
  *Say:* "Maintenance and complaints are tracked as tickets."

- [ ] **Documents** — `/student/documents`
  Upload/view personal documents (CNIC, etc.).
  *Test:* upload a file (field is `document`, with a document type) → it lists.
  *Say:* "Document storage for each resident."

- [ ] **Announcements (student)** — `/student/announcements`
  Read announcements published by admin/warden.
  *Test:* list loads (publish one as admin first if empty).

- [ ] **Profile** — `/student/profile`
  View/edit own profile, change password.
  *Test:* edit a field → save → refresh → change persists.

### E. Warden operations (log in as Warden)

- [ ] **Warden dashboard** — `/warden`  → overview loads.
- [ ] **Allocation** — `/warden/allocation` → assign/move residents (covered in C).
- [ ] **Attendance** — `/warden/attendance` → mark/review attendance, approve leave.
  *Say:* "The warden marks attendance and approves student leave."
- [ ] **Visitors** — `/warden/visitors` → approve/log visitor entries.
- [ ] **Support** — `/warden/support` → respond to / resolve tickets the student raised.
  *Say:* "Tickets flow from student to warden, who resolves them."
- [ ] **Fees** — `/warden/fees` → view/record fee status.
- [ ] **Mess** — `/warden/mess` → manage mess plans/menu.
- [ ] **Announcements** — `/warden/announcements` → create + publish an announcement.

### F. Admin — money, assets, communication, reports

- [ ] **Finance** — `/admin/finance` → revenue / collections / dues.
- [ ] **Mess (admin)** — `/admin/mess` → plans, billing oversight.
- [ ] **Assets** — `/admin/assets` → inventory/asset register.
- [ ] **Announcements (admin)** — `/admin/announcements` → create → **publish** (two steps).
  *Test:* publish one, then confirm it shows on `/student/announcements`.
- [ ] **Reports** — `/admin/reports`
  Aggregated dashboards: overview, fee dashboard, support dashboard.
  *Note:* these are **aggregates only** (donuts/progress bars), not time-series line charts —
  that's expected, the API returns totals not history.
  *Say:* "Reporting pulls live aggregates across fees, occupancy and support."

---

## Part 2 — The supervisor demo (one clean 10-minute story)

Don't click randomly in front of your supervisor. Tell **one connected story** that shows
the full lifecycle. Practice it once beforehand.

> **The story: a student's journey from applicant to resident.**

1. **Landing page** (`/`) — "This is the public hostel site." (15 sec)
2. **Apply** (`/apply`) — submit a new application live. "A student applies." (1 min)
3. **Admin approves** — log in as Admin → `/admin/users` → approve that applicant. (1 min)
4. **Allocate a room** — `/admin/allocations` → place the student in a room. (1 min)
5. **Student side** — log in as Student → `/student` → show **room** is assigned,
   **fees** appear, read an **announcement**. (2 min)
6. **Student raises a support ticket** (`/student/support`). (30 sec)
7. **Warden resolves it** — log in as Warden → `/warden/support` → resolve the ticket. (1 min)
8. **Warden marks attendance** (`/warden/attendance`) and **publishes an announcement**. (1 min)
9. **Admin reports** (`/admin/reports`) — "Everything we just did rolls up into live
   dashboards." (1 min)

**Closing line:** "Full-stack system — Next.js + React frontend, Node/Express + PostgreSQL
backend, JWT auth with role-based access, covering the complete resident lifecycle across
admin, warden and student roles."

> **Tip:** Pre-create the demo student a few minutes before the meeting (steps 2–4) so you
> can *also* just log straight in as the existing `student@secondhome.app` if the live apply
> flow hiccups. Always have a backup path.

---

## Part 3 — If something breaks

| Symptom | Likely cause | Fix |
|---|---|---|
| Page spins forever / blank | Backend not running | Check Terminal 2; `npm run dev` in `backend/` |
| "Network error" on login | API base wrong | `frontend/.env.local` must be `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1` |
| Login fails for demo users | DB data wiped | `cd backend && node scripts/create-demo-users.js` |
| 401 / logged out instantly | Token/refresh issue | Clear browser localStorage, log in again |
| 500 on a request | Backend bug | Note the URL + status from DevTools Network tab, tell me |
| Build check | — | `cd frontend && npm run build` (should be green, ~38 routes) |

**Confirm the whole backend is healthy before a demo:**
```bash
cd ~/my-projects/fyp/backend && npm run smoke   # runs the full API smoke suite
```

---

### One-line summary
Everything is built. Walk Part 1 top-to-bottom ticking boxes (≈1 hour), fix anything red,
then rehearse the Part 2 story once. That's your supervisor demo. ✅
