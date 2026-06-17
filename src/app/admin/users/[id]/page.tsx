"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Download, FileText, Mail, MapPin, Phone, Plus, Trash2, Upload } from "lucide-react";
import { Skeleton, SkeletonCards } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import SimpleSelect from "@/components/ui/simple-select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAsync } from "@/lib/useAsync";
import { usersApi } from "@/lib/features/users/api";
import type { ManagedUser } from "@/lib/features/users/types";
import {
  studentsApi,
  type StudentRecord,
  type StudentProfileInput,
  type StudentDocument,
  type ContactInput,
} from "@/lib/features/students";
import { API_URL } from "@/lib/http";

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
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
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
  const photo = record?.profile_image_url || null;

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

      <div className="mx-auto w-full max-w-5xl space-y-4">
        {/* Identity header — mirrors the resident profile */}
        <Card>
          <CardContent className="flex flex-col items-center gap-5 pt-6 text-center sm:flex-row sm:text-left">
            <div className="relative shrink-0">
              <Avatar className="size-24">
                {photo && <AvatarImage src={photo} alt={user.full_name} />}
                <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">{initials(user.full_name)}</AvatarFallback>
              </Avatar>
              {isStudent && (
                <>
                  <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    disabled={busy || !record}
                    className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-card bg-gold text-gold-foreground disabled:opacity-50"
                    aria-label="Change photo"
                  >
                    <Camera className="size-4" />
                  </button>
                </>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-semibold">{user.full_name}</h2>
              <p className="text-sm capitalize text-muted-foreground">{user.role?.name}</p>
              <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                <StatusBadge status={statusOf(user)} />
                {user.is_verified
                  ? <Badge variant="outline" className="border-success/25 bg-success/12 text-success">Email verified</Badge>
                  : <Badge variant="outline" className="border-warning/30 bg-warning/10 text-gold-foreground">Verifies after login</Badge>}
              </div>
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Mail className="size-4 shrink-0" /> {user.email}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Phone className="size-4 shrink-0" /> {user.phone ?? "—"}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><MapPin className="size-4 shrink-0" /> {record?.department ?? "Second Home"}</p>
            </div>
          </CardContent>
        </Card>

        {isStudent ? (
          <>
            <PersonalDetailsCard
              user={user}
              record={record}
              loading={studentsQ.loading}
              busy={busy}
              setBusy={setBusy}
              userId={userId}
              onSaved={() => Promise.all([userQ.refetch(), studentsQ.refetch()])}
            />
            {record && <EmergencyContactsCard studentId={record.id} />}
            {record && <DocumentsCard studentId={record.id} />}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>This {user.role?.name} account is managed from here.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use the buttons above to activate or deactivate this account. Full profiles are available for residents.
            </CardContent>
          </Card>
        )}
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

// ── Personal details (view / edit / create) ──────────────────────────────────

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({ value: v, label: v }));

function PersonalDetailsCard({
  user,
  record,
  loading,
  busy,
  setBusy,
  userId,
  onSaved,
}: {
  user: ManagedUser;
  record: StudentRecord | null;
  loading: boolean;
  busy: boolean;
  setBusy: (v: boolean) => void;
  userId: string;
  onSaved: () => Promise<unknown>;
}) {
  const creating = !record;
  const [editing, setEditing] = React.useState(false);

  const build = React.useCallback(
    (): StudentProfileInput => ({
      student_id: record?.student_id ?? "",
      date_of_birth: record?.date_of_birth ? String(record.date_of_birth).slice(0, 10) : "",
      gender: record?.gender ?? "male",
      admission_date: record?.admission_date ? String(record.admission_date).slice(0, 10) : "",
      department: record?.department ?? "",
      year_of_study: record?.year_of_study,
      blood_group: record?.blood_group ?? "",
      address: record?.address ?? "",
      guardian_name: record?.guardian_name ?? "",
      guardian_phone: record?.guardian_phone ?? "",
      guardian_email: record?.guardian_email ?? "",
    }),
    [record],
  );

  const [f, setF] = React.useState<StudentProfileInput>(build);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { if (!editing) setF(build()); }, [editing, build]);

  const set = (k: keyof StudentProfileInput, v: string) =>
    setF((p) => ({ ...p, [k]: k === "year_of_study" ? (v ? Number(v) : undefined) : v }));

  const validCreate = f.student_id && f.date_of_birth && f.gender && f.admission_date;
  const editingNow = editing || creating;

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

  const details = [
    { label: "Student ID", value: record?.student_id ?? "—" },
    { label: "Department", value: record?.department ?? "—" },
    { label: "Year", value: record?.year_of_study ? `Year ${record.year_of_study}` : "—" },
    { label: "Gender", value: record?.gender ?? "—" },
    { label: "Date of birth", value: record?.date_of_birth ? String(record.date_of_birth).slice(0, 10) : "—" },
    { label: "Admission", value: record?.admission_date ? String(record.admission_date).slice(0, 10) : "—" },
    { label: "Blood group", value: record?.blood_group ?? "—" },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone ?? "—" },
    { label: "Status", value: user.is_approved ? "Approved" : "Pending" },
    { label: "Address", value: record?.address ?? "—" },
    { label: "Guardian", value: record?.guardian_name ?? "—" },
    { label: "Guardian phone", value: record?.guardian_phone ?? "—" },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{creating ? "Set up student profile" : "Personal details"}</CardTitle>
          <CardDescription>
            {creating
              ? "Required: student ID, date of birth, gender, admission date."
              : editing
                ? "Edit the resident's details below, then save."
                : "Information on file with administration"}
          </CardDescription>
        </div>
        {!creating && (
          editing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" disabled={busy} onClick={save}><Check className="size-4" /> Save changes</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit profile</Button>
          )
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-24" /></div>
            ))}
          </div>
        ) : editingNow ? (
          <div className="space-y-4">
            <Section title="Academic">
              <Field label="Student ID *"><Input value={f.student_id} onChange={(e) => set("student_id", e.target.value)} placeholder="STU-2026-184" /></Field>
              <Field label="Department"><Input value={f.department ?? ""} onChange={(e) => set("department", e.target.value)} placeholder="Computer Science" /></Field>
              <Field label="Year of study"><Input type="number" min={1} max={10} value={f.year_of_study ?? ""} onChange={(e) => set("year_of_study", e.target.value)} placeholder="2" /></Field>
              <Field label="Admission date *"><DatePicker value={f.admission_date} onChange={(v) => set("admission_date", v)} placeholder="Pick a date" /></Field>
            </Section>
            <Section title="Personal">
              <Field label="Gender *"><SimpleSelect value={f.gender} onChange={(v) => set("gender", v)} className="w-full" options={GENDERS} /></Field>
              <Field label="Date of birth *"><DatePicker value={f.date_of_birth} onChange={(v) => set("date_of_birth", v)} placeholder="Pick a date" /></Field>
              <Field label="Blood group"><SimpleSelect value={f.blood_group ?? ""} onChange={(v) => set("blood_group", v)} className="w-full" placeholder="Select…" options={BLOOD_GROUPS} /></Field>
              <Field label="Address" full><Input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Street, city" /></Field>
            </Section>
            <Section title="Guardian">
              <Field label="Guardian name"><Input value={f.guardian_name ?? ""} onChange={(e) => set("guardian_name", e.target.value)} /></Field>
              <Field label="Guardian phone"><Input value={f.guardian_phone ?? ""} onChange={(e) => set("guardian_phone", e.target.value)} placeholder="+92…" /></Field>
              <Field label="Guardian email" full><Input type="email" value={f.guardian_email ?? ""} onChange={(e) => set("guardian_email", e.target.value)} placeholder="guardian@example.com" /></Field>
            </Section>
            {creating && (
              <div className="flex justify-end">
                <Button size="sm" disabled={busy || !validCreate} onClick={save}><Check className="size-4" /> Create profile</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {details.map((i) => (
              <div key={i.label}>
                <p className="text-xs text-muted-foreground">{i.label}</p>
                <p className="mt-0.5 text-sm font-medium capitalize">{i.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${full ? "col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ── Emergency contacts ───────────────────────────────────────────────────────

function EmergencyContactsCard({ studentId }: { studentId: string }) {
  const q = useAsync(() => studentsApi.contacts(studentId), [studentId]);
  const [busy, setBusy] = React.useState(false);

  const add = async (body: ContactInput) => {
    setBusy(true);
    try {
      await studentsApi.addContact(studentId, body);
      toast.success("Contact added");
      await q.refetch();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const remove = async (contactId: string) => {
    setBusy(true);
    try {
      await studentsApi.deleteContact(studentId, contactId);
      toast.success("Contact removed");
      await q.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const contacts = q.data ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Emergency contacts</CardTitle>
          <CardDescription>Who we contact in an emergency</CardDescription>
        </div>
        <AddContactDialog onAdd={add} />
      </CardHeader>
      <CardContent className="space-y-3">
        {q.loading ? (
          <SkeletonCards count={2} />
        ) : contacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No emergency contacts added yet.</p>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">
                  {c.contact_name}{" "}
                  {c.is_primary && <Badge variant="secondary" className="ml-1 font-normal">Primary</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">{c.relationship} · {c.phone}</p>
              </div>
              <Button variant="ghost" size="icon-sm" className="text-destructive" disabled={busy} onClick={() => remove(c.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AddContactDialog({ onAdd }: { onAdd: (body: ContactInput) => Promise<boolean> }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const valid = name.trim() && relationship.trim() && phone.trim();

  const submit = async () => {
    setBusy(true);
    const ok = await onAdd({ contact_name: name, relationship, phone });
    setBusy(false);
    if (ok) { setName(""); setRelationship(""); setPhone(""); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-4" /> Add
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add emergency contact</DialogTitle>
          <DialogDescription>Someone we can reach if needed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-rel">Relationship</Label>
              <Input id="c-rel" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Father" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92…" />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!valid || busy} onClick={submit}>Add contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Documents ────────────────────────────────────────────────────────────────

const DOC_SLOTS = [
  { value: "cnic", label: "National ID Card" },
  { value: "admission_letter", label: "Admission Letter" },
  { value: "medical_certificate", label: "Medical Certificate" },
  { value: "guardian_cnic", label: "Guardian CNIC" },
];
const FIXED_TYPES = DOC_SLOTS.map((s) => s.value);

function resolveUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  const origin = API_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function DocumentsCard({ studentId }: { studentId: string }) {
  const q = useAsync(() => studentsApi.documents(studentId), [studentId]);
  const [busy, setBusy] = React.useState(false);
  const documents = q.data ?? [];
  const others = documents.filter((d) => !FIXED_TYPES.includes(d.document_type));

  const upload = async (file: File, documentType: string, documentName?: string) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("document", file);
      form.append("document_type", documentType);
      if (documentName) form.append("document_name", documentName);
      await studentsApi.uploadDocument(studentId, form);
      toast.success("Document uploaded");
      await q.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (documentId: string) => {
    setBusy(true);
    try {
      await studentsApi.deleteDocument(studentId, documentId);
      toast.success("Document removed");
      await q.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Verification documents on file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{q.error}</div>
        )}
        {q.loading ? (
          <SkeletonCards count={4} />
        ) : (
          <>
            {DOC_SLOTS.map((slot) => (
              <DocSlot
                key={slot.value}
                label={slot.label}
                doc={documents.find((d) => d.document_type === slot.value) ?? null}
                busy={busy}
                onUpload={(file) => upload(file, slot.value, slot.label)}
                onRemove={remove}
              />
            ))}

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <p className="font-medium">Other documents</p>
                </div>
                <UploadButton label="Add" busy={busy} onUpload={(file) => upload(file, "other", file.name)} />
              </div>
              {others.length > 0 && (
                <div className="mt-3 space-y-2">
                  {others.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <span className="truncate">{d.document_name}</span>
                      <div className="flex items-center gap-1">
                        {d.document_url && (
                          <a href={resolveUrl(d.document_url)} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon-sm"><Download className="size-4" /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive" disabled={busy} onClick={() => remove(d.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DocSlot({
  label,
  doc,
  busy,
  onUpload,
  onRemove,
}: {
  label: string;
  doc: StudentDocument | null;
  busy: boolean;
  onUpload: (file: File) => void;
  onRemove: (id: string) => void;
}) {
  const uploaded = !!doc;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${uploaded ? "bg-success/12 text-success" : "bg-primary/10 text-primary"}`}>
          {uploaded ? <Check className="size-5" /> : <FileText className="size-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          <p className="truncate text-xs text-muted-foreground">
            {uploaded
              ? `${doc!.document_name}${(doc!.uploaded_at || doc!.createdAt) ? ` · ${String(doc!.uploaded_at || doc!.createdAt).slice(0, 10)}` : ""}`
              : "Not uploaded yet"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {uploaded && doc!.document_url && (
          <a href={resolveUrl(doc!.document_url)} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="icon-sm"><Download className="size-4" /></Button>
          </a>
        )}
        {uploaded && (
          <Button variant="ghost" size="icon-sm" className="text-destructive" disabled={busy} onClick={() => onRemove(doc!.id)}>
            <Trash2 className="size-4" />
          </Button>
        )}
        <UploadButton label={uploaded ? "Replace" : "Upload"} busy={busy} onUpload={onUpload} />
      </div>
    </div>
  );
}

function UploadButton({ label, busy, onUpload }: { label: string; busy: boolean; onUpload: (file: File) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
        <Upload className="size-4" /> {label}
      </Button>
    </>
  );
}
