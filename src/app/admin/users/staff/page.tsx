"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUsers } from "@/lib/features/users/useUsers";
import { UsersTable, UsersShell, bucketUsers } from "../_shared";

export default function AdminStaff() {
  const actions = useUsers();
  const { staff } = bucketUsers(actions.users);
  return (
    <UsersShell actions={actions} title="Staff" description="Admin and staff accounts with back-office access.">
      <Card>
        <CardHeader>
          <UsersTable rows={staff} loading={actions.loading} kind="staff" />
        </CardHeader>
        <CardContent />
      </Card>
    </UsersShell>
  );
}
