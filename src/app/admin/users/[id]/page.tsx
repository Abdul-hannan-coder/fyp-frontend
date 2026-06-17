"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Mail, Phone, Save, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAsync } from "@/lib/useAsync";
import { usersApi } from "@/lib/features/users/api";
import type { ManagedUser } from "@/lib/features/users/types";
import { studentsApi, type StudentRecord, type StudentProfileInput } from "@/lib/features/students";
import SimpleSelect from "@/components/ui/simple-select";

const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");
const statusOf = (u: ManagedUser) => (!u.is_approved ? "pending" : u.is_active ? "active" : "blocked");

export default function AdminUserDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const userQ = useAsync(() => usersApi.get(userId), [userId]);
  const studentsQ = useAsync(() => studentsApi.list(), []);
  const record = (studentsQ.data ?? []).find((r) => r.user_id === userId) ?? null;

  const user = userQ.data;
  const [busy, setBusy] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const photoRef = React.useRef<HTMLInputElement>(null);

  const refresh = () => Promise.all([userQ.refetch(), studentsQ.refetch()]);

  const setStatus = async (action: "approve" | "activate") => {
    setBusy(true);
    try {
      if (action === "approve") await usersApi.approve(userId);
      else await usersApi.activate(userId);
      toast.success("Account updated");
      await userQ.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (reason: string) => {
    setBusy(true);
    try {
      await usersApi.deactivate(userId, reason || "Deactivated");
      toast.success("Account deactivated");
      setDeactivateOpen(false);
      await userQ.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await usersApi.remove(userId);
      toast.success("Account deleted");
      router.push("/admin/users");
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!record) {
      toast.error("Create the student profile first.");
      return;
    }
    setBusy(true);
    try {
      await studentsApi.uploadProfilePhoto(record.id, file);
      toast.success("Photo updated");
      await studentsQ.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (userQ.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <>
        <BackLink />
        <p className="py-20 text-center text-sm text-muted-foreground">User not found.</p>
      </>
    );
  }

  const isStudent = user.role?.name === "student";

  return (
    <>
      <BackLink />
      <PageHeader title={user.full_name} description={`${user.role?.name ?? "user"} account`}>
        {!user.is_approved && isStudent && (
          <Button disabled={busy} onClick={() => setStatus("approve")}>Approve</Button>
        )}
        {user.is_active ? (
          <Button variant="outline" className="text-destructive" disabled={busy} onClick={() => setDeactivateOpen(true)}>Deactivate</Button>
        ) : (
          <Button disabled={busy} onClick={() => setStatus("activate")}>Activate</Button>
        )}
        <Button variant="destructive" disabled={busy} onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Identity card */}
        <Card>
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="relative">
              <Avatar className="size-24">
                {record?.profile_image_url && <AvatarImage src={record.profile_image_url} alt={user.full_name} />}
                <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">{initials(user.full_name)}</AvatarFallback>
              </Avatar>
              {isStudent && (
                <>
                  <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                  <button type="button" onClick={() => photoRef.current?.click()} disabled={busy || !record}
                    className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-card bg-gold text-gold-foreground disabled:opacity-50">
                    <Camera className="size-4" />
                  </button>
                </>
              )}
            </div>
            <h2 className="mt-4 font-heading text-xl font-semibold">{user.full_name}</h2>
            <p className="text-sm capitalize text-muted-foreground">{user.role?.name}</p>
            <div className="mt-2"><StatusBadge status={statusOf(user)} /></div>
            <div className="mt-5 w-full space-y-2 text-left text-sm">
              <p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4" /> {user.email}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4" /> {user.phone ?? "—"}</p>
              {user.is_verified
                ? <Badge variant="outline" className="border-success/25 bg-success/12 text-success">Email verified</Badge>
                : <Badge variant="outline" className="border-warning/30 bg-warning/10 text-gold-foreground">Verifies after login</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Profile management */}
        <div className="lg:col-span-2">
          {isStudent ? (
            <ProfileCard
              record={record}
              loading={studentsQ.loading}
              busy={busy}
              setBusy={setBusy}
              userId={userId}
              onSaved={refresh}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>This {user.role?.name} account is managed from here.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use the buttons above to activate or deactivate this account. Detailed profiles are available for residents.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate account"
        description={`${user.full_name} won't be able to log in until reactivated.`}
        confirmLabel="Deactivate"
        destructive
        withReason
        reasonRequired
        reasonLabel="Reason for deactivation"
        busy={busy}
        onConfirm={deactivate}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete account permanently"
        description={`This permanently deletes ${user.full_name}'s account${isStudent ? " and resident profile" : ""}. This cannot be undone.`}
        confirmLabel="Delete permanently"
        destructive
        busy={busy}
        onConfirm={remove}
      />
    </>
  );
}

function BackLink() {
  return (
    <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Back to users
    </Link>
  );
}

const GENDERS = ["male", "female", "other"];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function ProfileCard({
  record,
  loading,
  busy,
  setBusy,
  userId,
  onSaved,
}: {
  record: StudentRecord | null;
  loading: boolean;
  busy: boolean;
  setBusy: (v: boolean) => void;
  userId: string;
  onSaved: () => Promise<unknown>;
}) {
  const [editing, setEditing] = React.useState(false);
  const creating = !record;

  const [f, setF] = React.useState<StudentProfileInput>({
    student_id: "", date_of_birth: "", gender: "male", admission_date: "",
    department: "", year_of_study: undefined, blood_group: "", address: "",
    guardian_name: "", guardian_phone: "", guardian_email: "",
  });

  React.useEffect(() => {
    if (record) {
      setF({
        student_id: record.student_id ?? "",
        date_of_birth: (record.date_of_birth ?? "").slice(0, 10),
        gender: record.gender ?? "male",
        admission_date: (record.admission_date ?? "").slice(0, 10),
        department: record.department ?? "",
        year_of_study: record.year_of_study,
        blood_group: record.blood_group ?? "",
        address: record.address ?? "",
        guardian_name: record.guardian_name ?? "",
        guardian_phone: record.guardian_phone ?? "",
        guardian_email: record.guardian_email ?? "",
      });
    }
  }, [record]);

  const set = (k: keyof StudentProfileInput, v: string) =>
    setF((p) => ({ ...p, [k]: k === "year_of_study" ? (v ? Number(v) : undefined) : v }));

  const validCreate = f.student_id && f.date_of_birth && f.gender && f.admission_date;

  const save = async () => {
    setBusy(true);
    try {
      if (creating) {
        await studentsApi.createProfile({ ...f, user_id: userId });
        toast.success("Profile created");
      } else {
        await studentsApi.updateProfile(record!.id, f);
        toast.success("Profile updated");
      }
      await onSaved();
      setEditing(false);
    } catch (err) {
      const e = err as { message: string; errors?: { message: string }[] };
      toast.error(e.errors?.[0]?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Read-only view (existing profile, not editing)
  if (record && !editing) {
    const rows: [string, React.ReactNode][] = [
      ["Student ID", record.student_id ?? "—"],
      ["Department", record.department ?? "—"],
      ["Year", record.year_of_study ? `Year ${record.year_of_study}` : "—"],
      ["Gender", record.gender ?? "—"],
      ["Date of birth", record.date_of_birth ? String(record.date_of_birth).slice(0, 10) : "—"],
      ["Admission", record.admission_date ? String(record.admission_date).slice(0, 10) : "—"],
      ["Blood group", record.blood_group ?? "—"],
      ["Guardian", record.guardian_name ?? "—"],
      ["Guardian phone", record.guardian_phone ?? "—"],
      ["Address", record.address ?? "—"],
    ];
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Student profile</CardTitle>
            <CardDescription>Information on file</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit profile</Button>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {rows.map(([k, v]) => (
            <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="mt-0.5 text-sm font-medium capitalize">{v}</p></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Create / edit form
  return (
    <Card>
      <CardHeader>
        <CardTitle>{creating ? "Set up student profile" : "Edit profile"}</CardTitle>
        <CardDescription>{creating ? "Required: student ID, date of birth, gender, admission date." : "Update the resident's details."}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Field label="Student ID *"><Input value={f.student_id} onChange={(e) => set("student_id", e.target.value)} placeholder="STU-2026-184" /></Field>
        <Field label="Department"><Input value={f.department ?? ""} onChange={(e) => set("department", e.target.value)} placeholder="Computer Science" /></Field>
        <Field label="Date of birth *"><Input type="date" value={f.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} /></Field>
        <Field label="Admission date *"><Input type="date" value={f.admission_date} onChange={(e) => set("admission_date", e.target.value)} /></Field>
        <Field label="Gender *">
          <SimpleSelect value={f.gender} onChange={(v) => set("gender", v)} className="w-full" options={GENDERS.map((g) => ({ value: g, label: g }))} />
        </Field>
        <Field label="Year of study"><Input type="number" min={1} max={10} value={f.year_of_study ?? ""} onChange={(e) => set("year_of_study", e.target.value)} placeholder="2" /></Field>
        <Field label="Blood group">
          <SimpleSelect value={f.blood_group ?? ""} onChange={(v) => set("blood_group", v)} className="w-full" options={[{ value: "", label: "—" }, ...BLOOD.map((b) => ({ value: b, label: b }))]} />
        </Field>
        <Field label="Guardian name"><Input value={f.guardian_name ?? ""} onChange={(e) => set("guardian_name", e.target.value)} /></Field>
        <Field label="Guardian phone"><Input value={f.guardian_phone ?? ""} onChange={(e) => set("guardian_phone", e.target.value)} placeholder="+92…" /></Field>
        <Field label="Guardian email"><Input type="email" value={f.guardian_email ?? ""} onChange={(e) => set("guardian_email", e.target.value)} /></Field>
        <Field label="Address" full><Input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
        <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
          {!creating && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>}
          <Button size="sm" disabled={busy || (creating && !validCreate)} onClick={save}>
            <Save className="size-4" /> {creating ? "Create profile" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
