"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { BlocksManager } from "../_managers";

export default function Page() {
  return (
    <>
      <PageHeader title="Blocks" description="Residential blocks of the hostel." />
      <div className="mt-5">
        <BlocksManager />
      </div>
    </>
  );
}
