"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { RoomsManager } from "../_managers";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Rooms"
        description="Create rooms with photos and amenities. Each room belongs to a room type — set those up first under Room Types."
      />
      <div className="mt-5">
        <RoomsManager />
      </div>
    </>
  );
}
