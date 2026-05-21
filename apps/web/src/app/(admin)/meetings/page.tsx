'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MeetingsList } from '@/components/meetings/MeetingsList';
import { useBookings, useCancelBooking } from '@/hooks/useBookings';

/** Wraps a meetings list for one filter so each tab manages its own cancel hook. */
function MeetingsTab({ filter }: { filter: 'upcoming' | 'past' }) {
  const { data, isLoading } = useBookings(filter);
  const cancel = useCancelBooking(filter);
  return (
    <MeetingsList
      bookings={data}
      isLoading={isLoading}
      canCancel={filter === 'upcoming'}
      onCancel={(id) => {
        if (confirm('Cancel this meeting?')) cancel.mutate(id);
      }}
    />
  );
}

export default function MeetingsPage() {
  return (
    <>
      <PageHeader title="Scheduled Events" subtitle="See and manage your booked meetings." />
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <MeetingsTab filter="upcoming" />
        </TabsContent>
        <TabsContent value="past">
          <MeetingsTab filter="past" />
        </TabsContent>
      </Tabs>
    </>
  );
}
