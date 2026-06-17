"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimpleSelect from "@/components/ui/simple-select";
import {
  useStaff,
  DUTY_TYPES,
  DUTY_PRIORITIES,
  DUTY_STATUSES,
  EMPLOYMENT_STATUSES,
  DAYS_OF_WEEK,
  SHIFT_TYPES,
  type StaffRole,
  type StaffMember,
  type StaffDuty,
  type StaffSchedule,
} from "@/lib/features/staff";
import { useUsers } from "@/lib/features/users/useUsers";
import type { ManagedUser } from "@/lib/features/users/types";

function opts(values: readonly string[]) {
  return values.map((v) => ({ value: v, label: v.replace(/_/g, " ") }));
}

function staffLabel(s: StaffMember) {
  return s.user?.full_name ?? s.name ?? s.id;
}

export default function AdminStaff() {
  const st = useStaff();
  const { users } = useUsers();
  const { staff, roles, duties, schedules, error } = st;

  return (
    <>
      <PageHeader title="Staff" description="Roles, members, duties and schedules." />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({staff.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
          <TabsTrigger value="duties">Duties ({duties.length})</TabsTrigger>
          <TabsTrigger value="schedules">Schedules ({schedules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTab st={st} users={users} />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab st={st} />
        </TabsContent>
        <TabsContent value="duties">
          <DutiesTab st={st} />
        </TabsContent>
        <TabsContent value="schedules">
          <SchedulesTab st={st} />
        </TabsContent>
      </Tabs>
    </>
  );
}

type UseStaff = ReturnType<typeof useStaff>;

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

function IconButton({ title, onClick, danger }: { title: string; onClick: () => void; danger?: boolean }) {
  return (
    <Button variant="ghost" size="icon" title={title} onClick={onClick} className={danger ? "text-destructive" : ""}>
      {danger ? <Trash2 className="size-4" /> : <Pencil className="size-4" />}
    </Button>
  );
}

// ════════════════════════════════ MEMBERS ════════════════════════════════

function MembersTab({ st, users }: { st: UseStaff; users: ManagedUser[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Staff members</CardTitle>
        <MemberDialog busy={st.busy} roles={st.roles} users={users} onCreate={st.createMember} />
      </CardHeader>
      <CardContent>
        {st.loading ? (
          <Loading />
        ) : st.staff.length === 0 ? (
          <Empty>No staff added yet — create a role, then add a member.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {st.staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{staffLabel(s)}</TableCell>
                  <TableCell className="text-muted-foreground">{s.role?.name ?? s.staffRole?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.employment_status ?? "active"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MemberDialog busy={st.busy} roles={st.roles} users={users} edit={s} onUpdate={st.updateMember} />
                    <IconButton
                      title="Remove"
                      danger
                      onClick={() => {
                        if (window.confirm(`Remove staff member "${staffLabel(s)}"?`)) st.deleteMember(s.id);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MemberDialog({
  busy,
  roles,
  users,
  edit,
  onCreate,
  onUpdate,
}: {
  busy: boolean;
  roles: StaffRole[];
  users: ManagedUser[];
  edit?: StaffMember;
  onCreate?: (b: { user_id: string; staff_role_id: string; phone?: string; employment_status?: string; salary_grade?: string }) => Promise<boolean>;
  onUpdate?: (id: string, b: { staff_role_id?: string; phone?: string; employment_status?: string; salary_grade?: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const [roleId, setRoleId] = React.useState(edit?.role?.id ?? "");
  const [phone, setPhone] = React.useState(edit?.phone ?? "");
  const [status, setStatus] = React.useState(edit?.employment_status ?? "active");
  const [grade, setGrade] = React.useState(edit?.salary_grade ?? "");

  React.useEffect(() => {
    if (!roleId && roles[0]) setRoleId(roles[0].id);
  }, [roles, roleId]);

  const submit = async () => {
    let ok = false;
    if (edit && onUpdate) {
      ok = await onUpdate(edit.id, { staff_role_id: roleId, phone: phone || undefined, employment_status: status, salary_grade: grade || undefined });
    } else if (onCreate) {
      ok = await onCreate({ user_id: userId, staff_role_id: roleId, phone: phone || undefined, employment_status: status, salary_grade: grade || undefined });
    }
    if (ok) {
      if (!edit) {
        setUserId("");
        setPhone("");
        setGrade("");
      }
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={edit ? <Button variant="ghost" size="icon" title="Edit" /> : <Button />}>
        {edit ? <Pencil className="size-4" /> : <><Plus className="size-4" /> Add staff</>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Edit staff member" : "Add staff member"}</DialogTitle>
          <DialogDescription>
            {edit ? "Update role, phone, status or salary grade." : "Link an existing user account to a staff role."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!edit && roles.length === 0 && <p className="text-xs text-muted-foreground">Create a staff role first.</p>}
          {!edit && (
            <div className="space-y-1.5">
              <Label>User account</Label>
              <SimpleSelect
                value={userId}
                onChange={setUserId}
                className="w-full"
                placeholder="Select a user…"
                options={users.map((u) => ({ value: u.id, label: `${u.full_name} (${u.email})` }))}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Staff role</Label>
              <SimpleSelect value={roleId} onChange={setRoleId} className="w-full" options={roles.map((r) => ({ value: r.id, label: r.name }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-phone">Phone</Label>
              <Input id="sm-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Employment status</Label>
              <SimpleSelect value={status} onChange={setStatus} className="w-full" options={opts(EMPLOYMENT_STATUSES)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-grade">Salary grade</Label>
              <Input id="sm-grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="G-7" />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={(!edit && !userId) || !roleId || busy} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} {edit ? "Save changes" : "Add member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════ ROLES ════════════════════════════════

function RolesTab({ st }: { st: UseStaff }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Staff roles</CardTitle>
        <RoleDialog busy={st.busy} onCreate={st.createRole} />
      </CardHeader>
      <CardContent>
        {st.rolesLoading ? (
          <Loading />
        ) : st.roles.length === 0 ? (
          <Empty>No roles yet — create one, e.g. Warden, Security.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {st.roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <RoleDialog busy={st.busy} edit={r} onUpdate={st.updateRole} />
                    <IconButton
                      title="Delete"
                      danger
                      onClick={() => {
                        if (window.confirm(`Delete role "${r.name}"?`)) st.deleteRole(r.id);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RoleDialog({
  busy,
  edit,
  onCreate,
  onUpdate,
}: {
  busy: boolean;
  edit?: StaffRole;
  onCreate?: (b: { name: string; description?: string }) => Promise<boolean>;
  onUpdate?: (id: string, b: { name?: string; description?: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(edit?.name ?? "");
  const [description, setDescription] = React.useState(edit?.description ?? "");

  const submit = async () => {
    let ok = false;
    if (edit && onUpdate) ok = await onUpdate(edit.id, { name, description: description || undefined });
    else if (onCreate) ok = await onCreate({ name, description: description || undefined });
    if (ok) {
      if (!edit) {
        setName("");
        setDescription("");
      }
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={edit ? <Button variant="ghost" size="icon" title="Edit" /> : <Button variant="outline" />}>
        {edit ? <Pencil className="size-4" /> : <><UserCog className="size-4" /> New role</>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Edit staff role" : "New staff role"}</DialogTitle>
          <DialogDescription>e.g. Warden, Security, Housekeeping.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sr-name">Name</Label>
            <Input id="sr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Security" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sr-desc">Description</Label>
            <Textarea id="sr-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || busy} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} {edit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════ DUTIES ════════════════════════════════

function DutiesTab({ st }: { st: UseStaff }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Staff duties</CardTitle>
        <DutyDialog busy={st.busy} staff={st.staff} onCreate={st.createDuty} />
      </CardHeader>
      <CardContent>
        {st.dutiesLoading ? (
          <Loading />
        ) : st.duties.length === 0 ? (
          <Empty>No duties assigned yet.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {st.duties.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.staff?.user?.full_name ?? "—"}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{(d.duty_type ?? "—").replace(/_/g, " ")}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{d.priority ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status ?? "pending"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DutyDialog busy={st.busy} staff={st.staff} edit={d} onUpdate={st.updateDuty} />
                    <IconButton
                      title="Delete"
                      danger
                      onClick={() => {
                        if (window.confirm("Delete this duty?")) st.deleteDuty(d.id);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DutyDialog({
  busy,
  staff,
  edit,
  onCreate,
  onUpdate,
}: {
  busy: boolean;
  staff: StaffMember[];
  edit?: StaffDuty;
  onCreate?: (b: { staff_id: string; duty_type: string; description?: string; priority?: string; status?: string; notes?: string }) => Promise<boolean>;
  onUpdate?: (id: string, b: { duty_type?: string; description?: string; priority?: string; status?: string; notes?: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [staffId, setStaffId] = React.useState(edit?.staff?.id ?? edit?.staff_id ?? "");
  const [type, setType] = React.useState(edit?.duty_type ?? DUTY_TYPES[0]);
  const [priority, setPriority] = React.useState(edit?.priority ?? "medium");
  const [status, setStatus] = React.useState(edit?.status ?? "pending");
  const [description, setDescription] = React.useState(edit?.description ?? "");

  React.useEffect(() => {
    if (!edit && !staffId && staff[0]) setStaffId(staff[0].id);
  }, [staff, staffId, edit]);

  const submit = async () => {
    let ok = false;
    if (edit && onUpdate) ok = await onUpdate(edit.id, { duty_type: type, priority, status, description: description || undefined });
    else if (onCreate) ok = await onCreate({ staff_id: staffId, duty_type: type, priority, status, description: description || undefined });
    if (ok) {
      if (!edit) setDescription("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={edit ? <Button variant="ghost" size="icon" title="Edit" /> : <Button />}>
        {edit ? <Pencil className="size-4" /> : <><Plus className="size-4" /> Assign duty</>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Edit duty" : "Assign duty"}</DialogTitle>
          <DialogDescription>Assign and track a staff duty.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!edit && staff.length === 0 && <p className="text-xs text-muted-foreground">Add a staff member first.</p>}
          {!edit && (
            <div className="space-y-1.5">
              <Label>Staff member</Label>
              <SimpleSelect value={staffId} onChange={setStaffId} className="w-full" options={staff.map((s) => ({ value: s.id, label: staffLabel(s) }))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duty type</Label>
              <SimpleSelect value={type} onChange={setType} className="w-full" options={opts(DUTY_TYPES)} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <SimpleSelect value={priority} onChange={setPriority} className="w-full" options={opts(DUTY_PRIORITIES)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <SimpleSelect value={status} onChange={setStatus} className="w-full" options={opts(DUTY_STATUSES)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sd-desc">Description</Label>
            <Textarea id="sd-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={(!edit && !staffId) || busy} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} {edit ? "Save changes" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════ SCHEDULES ════════════════════════════════

function SchedulesTab({ st }: { st: UseStaff }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Staff schedules</CardTitle>
        <ScheduleDialog busy={st.busy} staff={st.staff} onCreate={st.createSchedule} />
      </CardHeader>
      <CardContent>
        {st.schedulesLoading ? (
          <Loading />
        ) : st.schedules.length === 0 ? (
          <Empty>No schedules yet.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {st.schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.staff?.user?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.is_off_day ? `${s.day_of_week ?? "—"} (off)` : s.day_of_week ?? "—"}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{(s.shift_type ?? "—").replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.shift_start && s.shift_end ? `${s.shift_start} – ${s.shift_end}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <ScheduleDialog busy={st.busy} staff={st.staff} edit={s} onUpdate={st.updateSchedule} />
                    <IconButton
                      title="Delete"
                      danger
                      onClick={() => {
                        if (window.confirm("Delete this schedule?")) st.deleteSchedule(s.id);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleDialog({
  busy,
  staff,
  edit,
  onCreate,
  onUpdate,
}: {
  busy: boolean;
  staff: StaffMember[];
  edit?: StaffSchedule;
  onCreate?: (b: { staff_id: string; day_of_week: string; shift_start: string; shift_end: string; shift_type: string; is_off_day?: boolean; notes?: string }) => Promise<boolean>;
  onUpdate?: (id: string, b: { shift_start?: string; shift_end?: string; shift_type?: string; is_off_day?: boolean; notes?: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [staffId, setStaffId] = React.useState(edit?.staff?.id ?? edit?.staff_id ?? "");
  const [day, setDay] = React.useState(edit?.day_of_week ?? DAYS_OF_WEEK[0]);
  const [shiftType, setShiftType] = React.useState(edit?.shift_type ?? SHIFT_TYPES[0]);
  const [start, setStart] = React.useState(edit?.shift_start?.slice(0, 5) ?? "09:00");
  const [end, setEnd] = React.useState(edit?.shift_end?.slice(0, 5) ?? "17:00");
  const [offDay, setOffDay] = React.useState(edit?.is_off_day ?? false);

  React.useEffect(() => {
    if (!edit && !staffId && staff[0]) setStaffId(staff[0].id);
  }, [staff, staffId, edit]);

  const submit = async () => {
    let ok = false;
    if (edit && onUpdate) {
      ok = await onUpdate(edit.id, { shift_start: start, shift_end: end, shift_type: shiftType, is_off_day: offDay });
    } else if (onCreate) {
      ok = await onCreate({ staff_id: staffId, day_of_week: day, shift_start: start, shift_end: end, shift_type: shiftType, is_off_day: offDay });
    }
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={edit ? <Button variant="ghost" size="icon" title="Edit" /> : <Button />}>
        {edit ? <Pencil className="size-4" /> : <><Plus className="size-4" /> New schedule</>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Edit schedule" : "New schedule"}</DialogTitle>
          <DialogDescription>Define a staff member's shift for a day.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!edit && staff.length === 0 && <p className="text-xs text-muted-foreground">Add a staff member first.</p>}
          {!edit && (
            <div className="space-y-1.5">
              <Label>Staff member</Label>
              <SimpleSelect value={staffId} onChange={setStaffId} className="w-full" options={staff.map((s) => ({ value: s.id, label: staffLabel(s) }))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Day of week</Label>
              <SimpleSelect
                value={day}
                onChange={setDay}
                className="w-full"
                disabled={!!edit}
                options={DAYS_OF_WEEK.map((dd) => ({ value: dd, label: dd }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Shift type</Label>
              <SimpleSelect value={shiftType} onChange={setShiftType} className="w-full" options={opts(SHIFT_TYPES)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ss-start">Shift start</Label>
              <Input id="ss-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ss-end">Shift end</Label>
              <Input id="ss-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={offDay} onChange={(e) => setOffDay(e.target.checked)} className="size-4" />
            Off day
          </label>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={(!edit && !staffId) || !start || !end || busy} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} {edit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
