'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, HelpCircle, Calendar, ExternalLink, MoreHorizontal } from 'lucide-react';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useMe } from '@/hooks/useMe';
import { EventTypeCard } from '@/components/event-types/EventTypeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendlyLoader } from '@/components/ui/calendly-loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const TABS = ['Event types'] as const;

export default function SchedulingPage() {
  const { data: eventTypes, isLoading, isError } = useEventTypes();
  const { data: me } = useMe();
  const [query, setQuery] = useState('');

  const filtered = eventTypes?.filter((e) =>
    e.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="md:pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          Scheduling <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </h1>
        <Button asChild className="rounded-full px-5">
          <Link href="/event-types/new">
            <Plus className="h-4 w-4" /> Create
          </Link>
        </Button>
      </div>

      {/* Tabs (only "Event types" is functional in this demo) */}
      <div className="mb-6 flex gap-6 border-b border-border">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              'relative cursor-default pb-3 text-sm font-medium',
              i === 0 ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            {tab}
            {i === 0 && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
          </span>
        ))}
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search event types"
          className="pl-9"
        />
      </div>

      {/* Host row */}
      {me && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
              {me.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-semibold text-foreground">{me.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${me.username}`}
              target="_blank"
              className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View landing page
            </Link>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load event types</AlertTitle>
          <AlertDescription>Make sure the API is running, then try again.</AlertDescription>
        </Alert>
      )}

      {isLoading && <CalendlyLoader />}

      {filtered && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {query ? 'No matching event types' : 'No event types yet'}
          </h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {query ? 'Try a different search.' : 'Create your first event type to start booking.'}
          </p>
          {!query && (
            <Button asChild>
              <Link href="/event-types/new">
                <Plus className="h-4 w-4" /> Create your first event type
              </Link>
            </Button>
          )}
        </div>
      )}

      {filtered && filtered.length > 0 && me && (
        <div className="space-y-3">
          {filtered.map((et) => (
            <EventTypeCard key={et.id} eventType={et} username={me.username} />
          ))}
        </div>
      )}
    </div>
  );
}
