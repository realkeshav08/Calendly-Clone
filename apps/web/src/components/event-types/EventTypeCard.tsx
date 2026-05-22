'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, MoreHorizontal, Pencil, Trash2, ExternalLink, Power } from 'lucide-react';
import type { EventType } from '@/types/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useToggleEventType, useDeleteEventType } from '@/hooks/useEventTypes';

interface EventTypeCardProps {
  eventType: EventType;
  username: string;
}

/**
 * One event type rendered as Calendly's horizontal list card: a colored left
 * stripe, a (decorative) select checkbox, the title + meta, and right-aligned
 * actions — Copy link, open booking page, and a kebab menu (edit / turn on-off /
 * delete). Inactive events are dimmed.
 */
export function EventTypeCard({ eventType, username }: EventTypeCardProps) {
  const [copied, setCopied] = useState(false);
  const toggle = useToggleEventType();
  const remove = useDeleteEventType();

  const bookingPath = `/${username}/${eventType.slug}`;
  const bookingUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${bookingPath}` : bookingPath;

  async function copyLink() {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-white py-5 pl-5 pr-4 shadow-sm transition',
        !eventType.isActive && 'opacity-60',
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: eventType.color }}
        aria-hidden="true"
      />

      <input
        type="checkbox"
        aria-label={`Select ${eventType.title}`}
        className="ml-2 h-4 w-4 shrink-0 rounded border-gray-300"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-foreground">{eventType.title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {eventType.durationMinutes} min · One-on-One
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="outline" size="sm" className="rounded-full" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy link'}
        </Button>

        <Button asChild variant="ghost" size="icon" aria-label="Open booking page">
          <Link href={bookingPath} target="_blank">
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Event type actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/event-types/${eventType.id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggle.mutate({ id: eventType.id, isActive: !eventType.isActive })}
            >
              <Power className="h-4 w-4" /> {eventType.isActive ? 'Turn off' : 'Turn on'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (confirm(`Delete "${eventType.title}"?`)) remove.mutate(eventType.id);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
