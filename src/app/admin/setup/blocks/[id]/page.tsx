"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SimpleSelect from "@/components/ui/simple-select";
import { PageHeader } from "@/components/dashboard/page-header";
import { useRoomsAdmin } from "@/lib/features/rooms";

const GENDERS = [
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
  { value: "mixed", label: "Mixed" },
];

export default function BlockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { blocks, floors, loading, busy, updateBlock } = useRoomsAdmin();

  const block = blocks.find((b) => b.id === id);

  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState("");
  const [totalFloors, setTotalFloors] = React.useState("");
  const [gender, setGender] = React.useState("boys");
  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");

  const openEdit = () => {
    if (!block) return;
    setName(block.name);
    setTotalFloors(block.total_floors != null ? String(block.total_floors) : "");
    setGender(block.gender ?? "boys");
    setLocation(block.location ?? "");
    setDescription(block.description ?? "");
    setEditing(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!block) return;
    const ok = await updateBlock(block.id, {
      name: name.trim(),
      total_floors: totalFloors ? Number(totalFloors) : undefined,
      gender,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (ok) setEditing(false);
  };

  if (loading && !block) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!block) {
    return (
      <div className="space-y-6">
        <PageHeader title="Block not found" description="This block may have been removed." />
        <ButtonLink variant="ghost" size="sm" href="/admin/setup/blocks">
          <ArrowLeft className="size-4" /> Back to blocks
        </ButtonLink>
      </div>
    );
  }

  const blockFloors = floors
    .filter((f) => f.block_id === block.id)
    .sort((a, b) => a.floor_number - b.floor_number);

  return (
    <div className="space-y-6">
      <PageHeader title={block.name} description={block.description || "Block details"}>
        <ButtonLink variant="ghost" size="sm" href="/admin/setup/blocks">
          <ArrowLeft className="size-4" /> Back
        </ButtonLink>
        <Button size="sm" variant={editing ? "secondary" : "default"} onClick={() => (editing ? setEditing(false) : openEdit())} disabled={busy}>
          {editing ? <><X className="size-4" /> Cancel</> : <><Pencil className="size-4" /> Edit</>}
        </Button>
      </PageHeader>

      {editing && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Edit block</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Block A" required />
                </div>
                <div className="space-y-2">
                  <Label>Total floors</Label>
                  <Input type="number" min={1} value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <div>
                    <SimpleSelect value={gender} onChange={setGender} options={GENDERS} className="w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="North wing" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Senior boys block" />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />} Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gender</dt>
                <dd>
                  {block.gender ? (
                    <Badge variant="secondary" className="font-normal capitalize">{block.gender}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <Field label="Location" value={block.location || "—"} />
              <Field label="Total floors" value={block.total_floors != null ? String(block.total_floors) : "—"} />
              <Field label="Floors configured" value={String(blockFloors.length)} />
            </dl>

            {block.description && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                <p className="text-sm">{block.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Floors ({blockFloors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {blockFloors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No floors configured for this block yet.</p>
            ) : (
              <div className="space-y-2">
                {blockFloors.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
                  >
                    <span className="font-medium">Floor {f.floor_number}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
