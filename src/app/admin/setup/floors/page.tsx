"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { FloorsManager } from "../_managers";

export default function Page() {
  return (
    <>
      <PageHeader title="Floors" description="Floors within each block." />
      <div className="mt-5">
        <FloorsManager />
      </div>
    </>
  );
}
