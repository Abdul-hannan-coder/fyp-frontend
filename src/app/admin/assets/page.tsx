"use client";

import * as React from "react";
import { Boxes, History, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
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
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { useAsync } from "@/lib/useAsync";
import { roomsApi, type Room } from "@/lib/features/rooms";
import {
  useAssets,
  useAssetAllocations,
  useAssetMaintenance,
  ASSET_CONDITIONS,
  ASSET_STATUSES,
  ALLOCATION_STATUSES,
  MAINTENANCE_TYPES,
  type Asset,
  type AssetCategory,
  type AssetHistory,
  type AssetInput,
  type CategoryInput,
  type AllocationInput,
  type MaintenanceInput,
} from "@/lib/features/assets";

export default function AdminAssets() {
  const a = useAssets();
  const { assets, categories, loading, error } = a;

  return (
    <>
      <PageHeader title="Assets" description="Inventory, allocation and maintenance.">
        <CategoryDialog busy={a.busy} onCreate={a.createCategory} />
        <AssetDialog busy={a.busy} categories={categories} onCreate={a.createAsset} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total assets" value={String(assets.length)} hint="registered" />
        <StatCard label="Categories" value={String(categories.length)} hint="defined" />
        <StatCard label="In maintenance" value={String(assets.filter((x) => x.status === "maintenance").length)} trend="flat" hint="being serviced" />
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <RegisterTab
            assets={assets}
            categories={categories}
            loading={loading}
            busy={a.busy}
            onUpdate={a.updateAsset}
            onDelete={a.deleteAsset}
            getHistory={a.history}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab
            categories={categories}
            busy={a.busy}
            onUpdate={a.updateCategory}
            onDelete={a.deleteCategory}
          />
        </TabsContent>

        <TabsContent value="allocations">
          <AllocationsTab assets={assets} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceTab assets={assets} />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ── Register tab ──
function RegisterTab({
  assets,
  categories,
  loading,
  busy,
  onUpdate,
  onDelete,
  getHistory,
}: {
  assets: Asset[];
  categories: AssetCategory[];
  loading: boolean;
  busy: boolean;
  onUpdate: (id: string, b: Partial<AssetInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  getHistory: (id: string) => Promise<AssetHistory>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset register</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonTable cols={6} />
        ) : assets.length === 0 ? (
          <Empty text="No assets registered yet — add a category, then an asset." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{x.asset_code ?? "—"}</TableCell>
                  <TableCell className="font-medium">{x.name}</TableCell>
                  <TableCell className="text-muted-foreground">{x.category?.name ?? "—"}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{x.condition ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={x.status ?? "available"} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <HistoryDialog asset={x} getHistory={getHistory} />
                      <EditAssetDialog asset={x} categories={categories} busy={busy} onUpdate={onUpdate} />
                      <Button variant="ghost" size="icon" disabled={busy} onClick={() => onDelete(x.id)} aria-label="Delete asset">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
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

// ── Categories tab ──
function CategoriesTab({
  categories,
  busy,
  onUpdate,
  onDelete,
}: {
  categories: AssetCategory[];
  busy: boolean;
  onUpdate: (id: string, b: CategoryInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <Empty text="No categories yet — create one from the header." />
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
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditCategoryDialog category={c} busy={busy} onUpdate={onUpdate} />
                      <Button variant="ghost" size="icon" disabled={busy} onClick={() => onDelete(c.id)} aria-label="Delete category">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
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

// ── Allocations tab ──
function AllocationsTab({ assets }: { assets: Asset[] }) {
  const al = useAssetAllocations();
  const roomsQ = useAsync(() => roomsApi.rooms(), []);
  const rooms = roomsQ.data ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Allocations</CardTitle>
        <AllocationDialog assets={assets} rooms={rooms} busy={al.busy} onCreate={al.create} />
      </CardHeader>
      <CardContent>
        {al.error && <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{al.error}</div>}
        {al.loading ? (
          <SkeletonTable cols={5} />
        ) : al.allocations.length === 0 ? (
          <Empty text="No allocations recorded yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>By</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {al.allocations.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{x.asset?.name ?? x.asset?.asset_code ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{x.room?.room_number ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{x.allocator?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(x.allocated_at)}</TableCell>
                  <TableCell className="text-right"><StatusBadge status={x.status ?? "active"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ── Maintenance tab ──
function MaintenanceTab({ assets }: { assets: Asset[] }) {
  const m = useAssetMaintenance();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Maintenance</CardTitle>
        <MaintenanceDialog assets={assets} busy={m.busy} onCreate={m.create} />
      </CardHeader>
      <CardContent>
        {m.error && <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{m.error}</div>}
        {m.loading ? (
          <SkeletonTable cols={5} />
        ) : m.maintenance.length === 0 ? (
          <Empty text="No maintenance records yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.maintenance.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{x.asset?.name ?? x.asset?.asset_code ?? "—"}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{x.maintenance_type ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{x.description ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(x.reported_at)}</TableCell>
                  <TableCell className="text-right"><StatusBadge status={x.status ?? "reported"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ── Dialogs ──
function CategoryDialog({ busy, onCreate }: { busy: boolean; onCreate: (b: { name: string; description?: string }) => Promise<boolean> }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const submit = async () => {
    const ok = await onCreate({ name, description: description || undefined });
    if (ok) { setName(""); setDescription(""); setOpen(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}><Boxes className="size-4" /> Category</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New asset category</DialogTitle>
          <DialogDescription>Group assets, e.g. Furniture, Electrical.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="ac-name">Name</Label><Input id="ac-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Furniture" /></div>
          <div className="space-y-1.5"><Label htmlFor="ac-desc">Description</Label><Textarea id="ac-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || busy} onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({ category, busy, onUpdate }: { category: AssetCategory; busy: boolean; onUpdate: (id: string, b: CategoryInput) => Promise<boolean> }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(category.name);
  const [description, setDescription] = React.useState(category.description ?? "");
  React.useEffect(() => { if (open) { setName(category.name); setDescription(category.description ?? ""); } }, [open, category]);
  const submit = async () => {
    const ok = await onUpdate(category.id, { name, description });
    if (ok) setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Edit category" />}><Pencil className="size-4" /></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>Update the category details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="ec-name">Name</Label><Input id="ec-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ec-desc">Description</Label><Textarea id="ec-desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || busy} onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssetDialog({ busy, categories, onCreate }: {
  busy: boolean;
  categories: AssetCategory[];
  onCreate: (b: AssetInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [cat, setCat] = React.useState("");
  const [condition, setCondition] = React.useState("good");
  const [status, setStatus] = React.useState("available");

  React.useEffect(() => { if (!cat && categories[0]) setCat(categories[0].id); }, [categories, cat]);

  const submit = async () => {
    const ok = await onCreate({ category_id: cat, name, asset_code: code, condition, status });
    if (ok) { setName(""); setCode(""); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" /> Add asset</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New asset</DialogTitle>
          <DialogDescription>Register a physical asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {categories.length === 0 && <p className="text-xs text-muted-foreground">Add a category first.</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="as-name">Name</Label><Input id="as-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Study Desk" /></div>
            <div className="space-y-1.5"><Label htmlFor="as-code">Asset code</Label><Input id="as-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="AST-1042" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <SimpleSelect value={cat} onChange={setCat} className="w-full" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <SimpleSelect value={condition} onChange={setCondition} className="w-full" options={ASSET_CONDITIONS.map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <SimpleSelect value={status} onChange={setStatus} className="w-full" options={ASSET_STATUSES.map((c) => ({ value: c, label: c }))} />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || !code.trim() || !cat || busy} onClick={submit}>
            Create asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditAssetDialog({ asset, categories, busy, onUpdate }: {
  asset: Asset;
  categories: AssetCategory[];
  busy: boolean;
  onUpdate: (id: string, b: Partial<AssetInput>) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(asset.name);
  const [code, setCode] = React.useState(asset.asset_code ?? "");
  const [cat, setCat] = React.useState(asset.category_id ?? asset.category?.id ?? "");
  const [condition, setCondition] = React.useState(asset.condition ?? "good");
  const [status, setStatus] = React.useState(asset.status ?? "available");

  React.useEffect(() => {
    if (open) {
      setName(asset.name);
      setCode(asset.asset_code ?? "");
      setCat(asset.category_id ?? asset.category?.id ?? "");
      setCondition(asset.condition ?? "good");
      setStatus(asset.status ?? "available");
    }
  }, [open, asset]);

  const submit = async () => {
    const ok = await onUpdate(asset.id, { category_id: cat, name, asset_code: code, condition, status });
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Edit asset" />}><Pencil className="size-4" /></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit asset</DialogTitle>
          <DialogDescription>Update the asset details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="ea-name">Name</Label><Input id="ea-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="ea-code">Asset code</Label><Input id="ea-code" value={code} onChange={(e) => setCode(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <SimpleSelect value={cat} onChange={setCat} className="w-full" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <SimpleSelect value={condition} onChange={setCondition} className="w-full" options={ASSET_CONDITIONS.map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <SimpleSelect value={status} onChange={setStatus} className="w-full" options={ASSET_STATUSES.map((c) => ({ value: c, label: c }))} />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || !code.trim() || !cat || busy} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ asset, getHistory }: { asset: Asset; getHistory: (id: string) => Promise<AssetHistory> }) {
  const [open, setOpen] = React.useState(false);
  const q = useAsync(() => getHistory(asset.id), [asset.id, String(open)], { enabled: open });
  const hist = q.data;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="View history" />}><History className="size-4" /></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>History — {asset.name}</DialogTitle>
          <DialogDescription>Allocation and maintenance timeline.</DialogDescription>
        </DialogHeader>
        {q.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : q.error ? (
          <p className="py-6 text-center text-sm text-destructive">{q.error}</p>
        ) : (
          <div className="space-y-5 max-h-[60vh] overflow-y-auto">
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Allocations</h4>
              {!hist || hist.allocations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No allocations.</p>
              ) : (
                <ul className="space-y-2">
                  {hist.allocations.map((al) => (
                    <li key={al.id} className="rounded-lg border border-border p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">Room {al.room?.room_number ?? "—"}</span>
                        <StatusBadge status={al.status ?? "active"} />
                      </div>
                      <p className="text-xs text-muted-foreground">{fmtDate(al.allocated_at)} · by {al.allocator?.full_name ?? "—"}</p>
                      {al.notes && <p className="mt-1 text-xs text-muted-foreground">{al.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Maintenance</h4>
              {!hist || hist.maintenance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No maintenance records.</p>
              ) : (
                <ul className="space-y-2">
                  {hist.maintenance.map((mt) => (
                    <li key={mt.id} className="rounded-lg border border-border p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">{mt.maintenance_type ?? "maintenance"}</span>
                        <StatusBadge status={mt.status ?? "reported"} />
                      </div>
                      <p className="text-xs text-muted-foreground">{mt.description}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(mt.reported_at)} · by {mt.reporter?.full_name ?? "—"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function AllocationDialog({ assets, rooms, busy, onCreate }: {
  assets: Asset[];
  rooms: Room[];
  busy: boolean;
  onCreate: (b: AllocationInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [asset, setAsset] = React.useState("");
  const [room, setRoom] = React.useState("");
  const [status, setStatus] = React.useState<string>("active");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => { if (!asset && assets[0]) setAsset(assets[0].id); }, [assets, asset]);
  React.useEffect(() => { if (!room && rooms[0]) setRoom(rooms[0].id); }, [rooms, room]);

  const submit = async () => {
    const ok = await onCreate({ asset_id: asset, room_id: room, status, notes: notes || undefined });
    if (ok) { setNotes(""); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" /> Allocate</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate asset</DialogTitle>
          <DialogDescription>Assign an asset to a room.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {assets.length === 0 && <p className="text-xs text-muted-foreground">Register an asset first.</p>}
          {rooms.length === 0 && <p className="text-xs text-muted-foreground">No rooms available.</p>}
          <div className="space-y-1.5">
            <Label>Asset</Label>
            <SimpleSelect value={asset} onChange={setAsset} className="w-full" options={assets.map((x) => ({ value: x.id, label: `${x.name}${x.asset_code ? ` (${x.asset_code})` : ""}` }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Room</Label>
            <SimpleSelect value={room} onChange={setRoom} className="w-full" options={rooms.map((r) => ({ value: r.id, label: r.room_number }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <SimpleSelect value={status} onChange={setStatus} className="w-full" options={ALLOCATION_STATUSES.map((s) => ({ value: s, label: s }))} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="alloc-notes">Notes</Label><Textarea id="alloc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!asset || !room || busy} onClick={submit}>Allocate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceDialog({ assets, busy, onCreate }: {
  assets: Asset[];
  busy: boolean;
  onCreate: (b: MaintenanceInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [asset, setAsset] = React.useState("");
  const [type, setType] = React.useState<string>("maintenance");
  const [description, setDescription] = React.useState("");
  const [cost, setCost] = React.useState("");

  React.useEffect(() => { if (!asset && assets[0]) setAsset(assets[0].id); }, [assets, asset]);

  const submit = async () => {
    const parsed = cost.trim() === "" ? undefined : Number(cost);
    const ok = await onCreate({
      asset_id: asset,
      maintenance_type: type,
      description,
      estimated_cost: parsed != null && !Number.isNaN(parsed) ? parsed : undefined,
    });
    if (ok) { setDescription(""); setCost(""); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Wrench className="size-4" /> Log maintenance</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log maintenance</DialogTitle>
          <DialogDescription>Report a maintenance, damage or lost event.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {assets.length === 0 && <p className="text-xs text-muted-foreground">Register an asset first.</p>}
          <div className="space-y-1.5">
            <Label>Asset</Label>
            <SimpleSelect value={asset} onChange={setAsset} className="w-full" options={assets.map((x) => ({ value: x.id, label: `${x.name}${x.asset_code ? ` (${x.asset_code})` : ""}` }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <SimpleSelect value={type} onChange={setType} className="w-full" options={MAINTENANCE_TYPES.map((t) => ({ value: t, label: t }))} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="mt-cost">Estimated cost</Label><Input id="mt-cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="mt-desc">Description</Label><Textarea id="mt-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's wrong?" /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!asset || !description.trim() || busy} onClick={submit}>Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──
function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
