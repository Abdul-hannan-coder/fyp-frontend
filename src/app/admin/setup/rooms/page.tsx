"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/page-header";
import { RoomsManager, RoomTypesManager } from "../_managers";

export default function Page() {
  return (
    <>
      <PageHeader title="Rooms & room types" description="Create rooms with photos and amenities, and manage the pricing tiers they belong to — all in one place." />
      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="types">Room Types</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms" className="mt-5"><RoomsManager /></TabsContent>
        <TabsContent value="types" className="mt-5"><RoomTypesManager /></TabsContent>
      </Tabs>
    </>
  );
}
