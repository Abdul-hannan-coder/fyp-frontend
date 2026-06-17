"use client";

import { usePublicOverview } from "@/lib/features/public";

export function StatsStrip() {
  const { overview } = usePublicOverview();

  const stats = [
    { v: overview ? `${overview.residents}+` : "—", l: "Residents" },
    { v: overview ? String(overview.blocks) : "—", l: "Blocks" },
    { v: overview ? `${overview.occupancy_rate}%` : "—", l: "Occupancy" },
    { v: "24/7", l: "Security & support" },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 border-y border-[#ece7df] py-8 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.l} className="text-center">
          <p className="font-heading text-3xl font-semibold text-[#181715]">{s.v}</p>
          <p className="mt-0.5 text-sm text-[#8a857d]">{s.l}</p>
        </div>
      ))}
    </div>
  );
}
