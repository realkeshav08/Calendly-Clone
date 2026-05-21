'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, ChevronRight } from 'lucide-react';
import { usePublicProfile } from '@/hooks/useSlots';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** Public landing page listing all of a host's bookable event types. */
export default function HostProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, isError } = usePublicProfile(username);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Host not found</AlertTitle>
          <AlertDescription>No scheduling page exists at this address.</AlertDescription>
        </Alert>
      )}

      {isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {data && (
        <>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white">
              {data.host.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{data.host.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an event type to book a time.
            </p>
          </div>

          <div className="space-y-3">
            {data.eventTypes.map((et) => (
              <Link key={et.id} href={`/${username}/${et.slug}`}>
                <Card className="flex items-center gap-4 p-5 transition hover:border-brand hover:shadow-md">
                  <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: et.color }} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{et.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {et.durationMinutes} min
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
