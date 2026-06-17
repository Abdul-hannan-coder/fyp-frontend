"use client";

import * as React from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUsers } from "@/lib/features/users/useUsers";
import { useStudentCsv } from "@/lib/features/students";
import { StudentCards, UsersShell, bucketUsers } from "../_shared";

export default function AdminStudents() {
  const actions = useUsers();
  const { students } = bucketUsers(actions.users);
  const csv = useStudentCsv(actions.refetch);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) csv.importCsv(file);
    e.target.value = ""; // allow re-picking the same file
  };

  return (
    <UsersShell actions={actions} title="Students" description="Approved residents and their account status.">
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onPick} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={csv.busy} onClick={csv.exportCsv}>
          {csv.busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
        </Button>
        <Button variant="outline" size="sm" disabled={csv.busy} onClick={() => fileRef.current?.click()}>
          {csv.busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Import CSV
        </Button>
      </div>
      <Card>
        <CardHeader>
          <StudentCards rows={students} loading={actions.loading} />
        </CardHeader>
        <CardContent />
      </Card>
    </UsersShell>
  );
}
