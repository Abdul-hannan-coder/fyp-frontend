"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Loader2, Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AnimatedTable } from "@/components/ui/animated-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useUsers } from "@/lib/features/users/useUsers";
import type { ManagedUser } from "@/lib/features/users/types";
import { studentsApi } from "@/lib/features/students";
import SimpleSelect from "@/components/ui/simple-select";

export type UsersActions = ReturnType<typeof useUsers>;

export const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");
export const statusOf = (u: ManagedUser) => (!u.is_approved ? "pending" : u.is_active ? "active" : "blocked");

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "blocked", label: "Blocked" },
];

// Returns true when the user matches the selected status filter.
const matchesStatus = (u: ManagedUser, status: string) => {
  if (status === "approved") return u.is_approved && u.is_active;
  if (status === "pending") return !u.is_approved;
  if (status === "blocked") return !u.is_active;
  return true; // "all"
};

// Derive the same role buckets every users sub-page works from.
export function bucketUsers(users: ManagedUser[]) {
  return {
    applications: users.filter((u) => !u.is_approved && u.role?.name === "student"),
    students: users.filter((u) => u.role?.name === "student" && u.is_approved),
    wardens: users.filter((u) => u.role?.name === "warden"),
    staff: users.filter((u) => u.role?.name === "staff" || u.role?.name === "admin"),
  };
}

/**
 * Shared shell for every users sub-page: header + create button, the four
 * count cards, and an error banner. Each page passes its own list as children.
 */
export function UsersShell({
  actions,
  title,
  description,
  children,
}: {
  actions: UsersActions;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { applications, students, wardens, staff } = bucketUsers(actions.users);
  return (
    <>
      <PageHeader title={title} description={description}>
        <CreateUserDialog creating={actions.creating} onCreate={actions.create} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={String(applications.length)} trend="flat" hint="awaiting review" />
        <StatCard label="Students" value={String(students.length)} trend="up" hint="approved residents" />
        <StatCard label="Wardens" value={String(wardens.length)} hint="operations" />
        <StatCard label="Staff" value={String(staff.length)} hint="admin / staff" />
      </div>

      {actions.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{actions.error}</div>
      )}

      {children}
    </>
  );
}

export function ApplicationsList({ actions }: { actions: UsersActions }) {
  const { loading } = actions;
  const { applications } = bucketUsers(actions.users);
  const [rejecting, setRejecting] = React.useState<ManagedUser | null>(null);
  const [approving, setApproving] = React.useState<ManagedUser | null>(null);

  return (
    <div className="space-y-3">
      {loading && <Loading />}
      {!loading && applications.length === 0 && <Empty label="No pending applications right now." />}
      {applications.map((a) => (
        <div key={a.id} className="flex flex-col gap-4 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/admin/users/${a.id}`} className="flex items-start gap-3 hover:opacity-90">
            <Avatar className="size-10"><AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{initials(a.full_name)}</AvatarFallback></Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{a.full_name}</p>
                {a.is_verified
                  ? <Badge variant="outline" className="border-success/25 bg-success/12 text-success">Email verified</Badge>
                  : <Badge variant="outline" className="border-warning/30 bg-warning/10 text-gold-foreground">Verifies after login</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{a.email}</p>
              {a.phone && <p className="text-xs text-muted-foreground">{a.phone}</p>}
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button variant="outline" size="sm" className="text-destructive" disabled={actions.busyId === a.id}
              onClick={() => setRejecting(a)}>
              <X className="size-4" /> Reject
            </Button>
            <Button size="sm" disabled={actions.busyId === a.id} onClick={() => setApproving(a)}>
              {actions.busyId === a.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
            </Button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(o) => !o && setApproving(null)}
        title="Approve application"
        description={approving ? `Approve ${approving.full_name}? Their selected room will be reserved and a payment raised. They'll be emailed to sign in and verify.` : ""}
        confirmLabel="Approve"
        busy={!!approving && actions.busyId === approving.id}
        onConfirm={() => { if (approving) { actions.approve(approving.id); setApproving(null); } }}
      />

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Reject application"
        description={rejecting ? `Reject ${rejecting.full_name}'s application? They'll be notified by email.` : ""}
        confirmLabel="Reject application"
        destructive
        withReason
        reasonRequired
        reasonLabel="Reason for rejection"
        busy={!!rejecting && actions.busyId === rejecting.id}
        onConfirm={(reason) => { if (rejecting) { actions.reject(rejecting.id, reason || "Not eligible"); setRejecting(null); } }}
      />
    </div>
  );
}

export function StudentCards({ rows, loading }: { rows: ManagedUser[]; loading: boolean }) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const filtered = rows.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesSearch && matchesStatus(u, status);
  });

  if (loading) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} resident{filtered.length === 1 ? "" : "s"}</p>
        <div className="flex items-center gap-2">
          <SimpleSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} className="h-9" />
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or email…" className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty label="No students yet — create one with the button above." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <Link key={u.id} href={`/admin/users/${u.id}`}
              className="group flex items-center gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
              <Avatar className="size-11"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(u.full_name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate font-medium">{u.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <div className="mt-1.5"><StatusBadge status={statusOf(u)} /></div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function UsersTable({ rows, loading, kind }: { rows: ManagedUser[]; loading: boolean; kind: "warden" | "staff" }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  // Role filter only applies to the Staff tab, which mixes staff + admin accounts.
  const [role, setRole] = React.useState("all");
  const filtered = rows.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = kind !== "staff" || role === "all" || u.role?.name === role;
    return matchesSearch && matchesStatus(u, status) && matchesRole;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm capitalize text-muted-foreground">{filtered.length} {kind}{filtered.length === 1 ? "" : "s"}</p>
        <div className="flex items-center gap-2">
          {kind === "staff" && (
            <SimpleSelect
              value={role}
              onChange={setRole}
              className="h-9"
              options={[
                { value: "all", label: "All roles" },
                { value: "staff", label: "Staff" },
                { value: "admin", label: "Admin" },
              ]}
            />
          )}
          <SimpleSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} className="h-9" />
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or email…" className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <AnimatedTable
          rows={filtered}
          getRowId={(u) => u.id}
          onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
          exportName={`${kind}s`}
          emptyLabel={`No ${kind} accounts.`}
          columns={[
            {
              key: "user", header: "User", sortValue: (u) => u.full_name.toLowerCase(),
              exportValue: (u) => `${u.full_name} <${u.email}>`,
              render: (u) => (
                <div className="flex items-center gap-3">
                  <Avatar className="size-8"><AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">{initials(u.full_name)}</AvatarFallback></Avatar>
                  <div className="leading-tight">
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              ),
            },
            { key: "phone", header: "Phone", className: "text-muted-foreground", render: (u) => u.phone ?? "—" },
            { key: "status", header: "Status", sortValue: (u) => statusOf(u), render: (u) => <StatusBadge status={statusOf(u)} /> },
            { key: "actions", header: "", align: "right", render: () => <ChevronRight className="ml-auto size-4 text-muted-foreground" /> },
          ]}
        />
      )}
    </div>
  );
}

export function CreateUserDialog({ creating, onCreate }: {
  creating: boolean;
  onCreate: (i: { email: string; password: string; full_name: string; phone?: string; role_name: "student" | "warden" | "staff" }) => Promise<ManagedUser | null>;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [role, setRole] = React.useState<"student" | "warden" | "staff">("student");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [withProfile, setWithProfile] = React.useState(false);
  const [studentId, setStudentId] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [gender, setGender] = React.useState("male");
  const [admission, setAdmission] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [year, setYear] = React.useState("");

  const valid = name.trim() && /\S+@\S+/.test(email) && password.length >= 8;
  const profileValid = !withProfile || (studentId && dob && admission);

  const reset = () => { setName(""); setEmail(""); setPhone(""); setPassword(""); setWithProfile(false); setStudentId(""); setDob(""); setAdmission(""); setDepartment(""); setYear(""); };

  const submit = async () => {
    setBusy(true);
    try {
      const user = await onCreate({ full_name: name, email, phone: phone || undefined, password, role_name: role });
      if (user && role === "student" && withProfile) {
        await studentsApi.createProfile({
          user_id: user.id, student_id: studentId, date_of_birth: dob, gender, admission_date: admission,
          department: department || undefined, year_of_study: year ? Number(year) : undefined,
        });
      }
      if (user) { reset(); setOpen(false); }
    } finally {
      setBusy(false);
    }
  };

  const isStudent = role === "student";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" /> Create account</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>The account is active immediately (no OTP) and login credentials are emailed to the user.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Account type</Label>
            <SimpleSelect value={role} onChange={(v) => setRole(v as "student" | "warden" | "staff")} className="w-full" options={[{ value: "student", label: "Student (resident)" }, { value: "warden", label: "Warden" }, { value: "staff", label: "Staff" }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="cu-name">Full name</Label><Input id="cu-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="cu-phone">Phone</Label><Input id="cu-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92…" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="cu-email">Email</Label><Input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" /></div>
          <div className="space-y-1.5"><Label htmlFor="cu-pass">Temporary password</Label><Input id="cu-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" /></div>

          {isStudent && (
            <div className="rounded-xl border bg-muted/30 p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={withProfile} onChange={(e) => setWithProfile(e.target.checked)} className="size-4" />
                Set up resident profile now
              </label>
              {withProfile && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Student ID *</Label><Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STU-2026-184" /></div>
                  <div className="space-y-1.5"><Label>Department</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" /></div>
                  <div className="space-y-1.5"><Label>Date of birth *</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Admission date *</Label><Input type="date" value={admission} onChange={(e) => setAdmission(e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label>Gender *</Label>
                    <SimpleSelect value={gender} onChange={setGender} className="w-full" options={[{ value: "male", label: "male" }, { value: "female", label: "female" }, { value: "other", label: "other" }]} />
                  </div>
                  <div className="space-y-1.5"><Label>Year of study</Label><Input type="number" min={1} max={10} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2" /></div>
                  <p className="col-span-2 text-xs text-muted-foreground">You can complete the rest (guardian, address, photo) on the resident&apos;s detail page.</p>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!valid || !profileValid || busy || creating} onClick={submit}>
            {(busy || creating) && <Loader2 className="size-4 animate-spin" />} Create {role} account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </div>
  );
}
export function Empty({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{label}</p>;
}
