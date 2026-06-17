"use client";

import { MapPin } from "lucide-react";

interface CentreCellProps {
  name?: string | null;
  code?: string | null;
}

export function CentreCell({ name, code }: CentreCellProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-[#332151] group-hover:text-[#E34F2D] transition-colors">
        {name || "—"}
      </p>
      {code && <p className="mt-0.5 font-mono text-[11px] text-slate-500">{code}</p>}
    </div>
  );
}

export function VilleCell({ ville }: { ville?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#5A5A7A]">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      {ville || "Non disponible"}
    </span>
  );
}
