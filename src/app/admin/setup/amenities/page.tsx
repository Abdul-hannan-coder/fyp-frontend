"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { AmenitiesManager } from "../_managers";

export default function Page() {
  return (
    <>
      <PageHeader title="Amenities" description="Priced add-ons attached to room types." />
      <div className="mt-5">
        <AmenitiesManager />
      </div>
    </>
  );
}
