"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { RoomTypesManager } from "../_managers";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Room types"
        description="Create and manage the pricing tiers (capacity, base price, amenities). Rooms are then created against these types."
      />
      <div className="mt-5">
        <RoomTypesManager />
      </div>
    </>
  );
}
