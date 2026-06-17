"use client";

import * as React from "react";
import { Camera, Check, Download, FileText, Mail, MapPin, Phone, Plus, Trash2, Upload } from "lucide-react";
import { Skeleton, SkeletonCards } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/features/auth/useAuth";
import { useMyProfile, useMyDocuments, type ContactInput, type StudentDocument } from "@/lib/features/students";
import { API_URL } from "@/lib/http";
import SimpleSelect from "@/components/ui/simple-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const { record, contacts, loading, busy, addContact, removeContact, uploadPhoto, updateRecord } = useMyProfile();
  const photoRef = React.useRef<HTMLInputElement>(null);

  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const name = user?.full_name ?? "Resident";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const photo = record?.profile_image_url || null;

  const buildState = React.useCallback(
    (): EditState => ({
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
      department: record?.department ?? "",
      year_of_study: record?.year_of_study ? String(record.year_of_study) : "",
      gender: record?.gender ?? "",
      date_of_birth: record?.date_of_birth ? String(record.date_of_birth).slice(0, 10) : "",
      blood_group: record?.blood_group ?? "",
      address: record?.address ?? "",
      guardian_name: record?.guardian_name ?? "",
      guardian_phone: record?.guardian_phone ?? "",
      guardian_email: record?.guardian_email ?? "",
    }),
    [user, record],
  );

  const [f, setF] = React.useState<EditState>(buildState);
  // Keep the form in sync with the latest data while NOT editing (so we never
  // clobber in-progress edits).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { if (!editing) setF(buildState()); }, [editing, buildState]);

  const set = (k: keyof EditState, v: string) => setF((s) => ({ ...s, [k]: v }));

  const details = [
    { label: "Student ID", value: record?.student_id ?? "—" },
    { label: "Department", value: record?.department ?? "—" },
    { label: "Year", value: record?.year_of_study ? `Year ${record.year_of_study}` : "—" },
    { label: "Gender", value: record?.gender ?? "—" },
    { label: "Date of birth", value: record?.date_of_birth ? String(record.date_of_birth).slice(0, 10) : "—" },
    { label: "Blood group", value: record?.blood_group ?? "—" },
    { label: "Email", value: user?.email ?? "—" },
    { label: "Phone", value: user?.phone ?? "—" },
    { label: "Status", value: user?.is_approved ? "Approved" : "Pending" },
    { label: "Address", value: record?.address ?? "—" },
    { label: "Guardian", value: record?.guardian_name ?? "—" },
    { label: "Guardian phone", value: record?.guardian_phone ?? "—" },
  ];

  const save = async () => {
    setSaving(true);
    try {
      const accountChanged = f.full_name !== (user?.full_name ?? "") || f.phone !== (user?.phone ?? "");
      if (accountChanged) await updateProfile({ full_name: f.full_name, phone: f.phone });
      const ok = await updateRecord({
        department: f.department || undefined,
        year_of_study: f.year_of_study ? Number(f.year_of_study) : undefined,
        gender: f.gender || undefined,
        date_of_birth: f.date_of_birth || undefined,
        blood_group: f.blood_group || undefined,
        address: f.address || undefined,
        guardian_name: f.guardian_name || undefined,
        guardian_phone: f.guardian_phone || undefined,
        guardian_email: f.guardian_email || undefined,
      });
      if (ok || accountChanged) {
        toast.success("Profile updated");
        setEditing(false);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="My profile" description="Your personal details, guardian info and documents.">
        {editing ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" disabled={saving} onClick={() => setEditing(false)}>Cancel</Button>
            <Button disabled={saving || !f.full_name.trim()} onClick={save}>
              <Check className="size-4" /> Save changes
            </Button>
          </div>
        ) : (
          <Button variant="outline" disabled={!record} onClick={() => setEditing(true)}>Edit profile</Button>
        )}
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-5 pt-6 text-center sm:flex-row sm:text-left">
            <div className="relative shrink-0">
              <Avatar className="size-24">
                {photo && <AvatarImage src={photo} alt={name} />}
                <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <input ref={photoRef} type="file" accept="image/*" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={busy || !record}
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-card bg-gold text-gold-foreground disabled:opacity-50"
                aria-label="Change photo"
              >
                <Camera className="size-4" />
              </button>
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">Resident</p>
              {user?.is_approved && (
                <Badge variant="outline" className="mt-2 border-success/25 bg-success/12 text-success">Verified &amp; approved</Badge>
              )}
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Mail className="size-4 shrink-0" /> {user?.email ?? "—"}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Phone className="size-4 shrink-0" /> {user?.phone ?? "—"}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><MapPin className="size-4 shrink-0" /> {record?.department ?? "Second Home"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal details</CardTitle>
              <CardDescription>
                {editing ? "Edit your details below, then save." : "Information on file with administration"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : editing ? (
                <div className="space-y-4">
                  <Section title="Account">
                    <Field label="Full name"><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
                    <Field label="Phone"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+92…" /></Field>
                    <Field label="Email" full>
                      <Input value={user?.email ?? ""} disabled readOnly />
                    </Field>
                  </Section>

                  <Section title="Academic">
                    <Field label="Student ID"><Input value={record?.student_id ?? ""} disabled readOnly /></Field>
                    <Field label="Department"><Input value={f.department} onChange={(e) => set("department", e.target.value)} placeholder="Computer Science" /></Field>
                    <Field label="Year of study"><Input type="number" min={1} max={6} value={f.year_of_study} onChange={(e) => set("year_of_study", e.target.value)} placeholder="2" /></Field>
                  </Section>

                  <Section title="Personal">
                    <Field label="Gender"><SimpleSelect value={f.gender} onChange={(v) => set("gender", v)} className="w-full" placeholder="Select…" options={GENDERS} /></Field>
                    <Field label="Date of birth"><DatePicker value={f.date_of_birth} onChange={(v) => set("date_of_birth", v)} placeholder="Pick a date" /></Field>
                    <Field label="Blood group"><SimpleSelect value={f.blood_group} onChange={(v) => set("blood_group", v)} className="w-full" placeholder="Select…" options={BLOOD_GROUPS} /></Field>
                    <Field label="Address" full><Input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, city" /></Field>
                  </Section>

                  <Section title="Guardian">
                    <Field label="Guardian name"><Input value={f.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} /></Field>
                    <Field label="Guardian phone"><Input value={f.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} placeholder="+92…" /></Field>
                    <Field label="Guardian email" full><Input type="email" value={f.guardian_email} onChange={(e) => set("guardian_email", e.target.value)} placeholder="guardian@example.com" /></Field>
                  </Section>
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

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Emergency contacts</CardTitle>
                <CardDescription>Who we contact in an emergency</CardDescription>
              </div>
              <AddContactDialog onAdd={addContact} disabled={!record} />
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
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
                    <Button variant="ghost" size="icon-sm" className="text-destructive" disabled={busy} onClick={() => removeContact(c.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <DocumentsCard />
        </div>
      </div>
    </>
  );
}

// ── Documents ────────────────────────────────────────────────────────────────

// Known document slots, each gets its own upload field.
const DOC_SLOTS = [
  { value: "cnic", label: "National ID Card" },
  { value: "admission_letter", label: "Admission Letter" },
  { value: "medical_certificate", label: "Medical Certificate" },
  { value: "guardian_cnic", label: "Guardian CNIC" },
];
const FIXED_TYPES = DOC_SLOTS.map((s) => s.value);

// document_url may be absolute or a server-relative path under the API host.
function resolveUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  const origin = API_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function DocumentsCard() {
  const { documents, loading, error, busy, upload, remove } = useMyDocuments();
  const others = documents.filter((d) => !FIXED_TYPES.includes(d.document_type));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Upload each verification document below</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
        )}
        {loading ? (
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

            {/* Other documents — allows multiple */}
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

// ── Edit profile ─────────────────────────────────────────────────────────────

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({ value: v, label: v }));

type EditState = {
  full_name: string;
  phone: string;
  department: string;
  year_of_study: string;
  gender: string;
  date_of_birth: string;
  blood_group: string;
  address: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
};

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

function AddContactDialog({
  onAdd,
  disabled,
}: {
  onAdd: (body: ContactInput) => Promise<boolean>;
  disabled?: boolean;
}) {
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
      <DialogTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
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
          <Button disabled={!valid || busy} onClick={submit}>
            Add contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
