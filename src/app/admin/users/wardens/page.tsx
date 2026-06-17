"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUsers } from "@/lib/features/users/useUsers";
import { UsersTable, UsersShell, bucketUsers } from "../_shared";

export default function AdminWardens() {
  const actions = useUsers();
  const { wardens } = bucketUsers(actions.users);
  return (
    <UsersShell actions={actions} title="Wardens" description="Manage warden accounts that run day-to-day operations.">
      <Card>
        <CardHeader>
          <UsersTable rows={wardens} loading={actions.loading} kind="warden" />
        </CardHeader>
        <CardContent />
      </Card>
    </UsersShell>
  );
}
