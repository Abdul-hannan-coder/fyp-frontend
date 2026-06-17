"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUsers } from "@/lib/features/users/useUsers";
import { ApplicationsList, UsersShell } from "./_shared";

export default function AdminUsers() {
  const actions = useUsers();
  return (
    <UsersShell actions={actions} title="Applications" description="Review and approve pending resident applications.">
      <Card>
        <CardHeader>
          <ApplicationsList actions={actions} />
        </CardHeader>
        <CardContent />
      </Card>
    </UsersShell>
  );
}
