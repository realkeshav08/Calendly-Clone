'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, MoreVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { EventType } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
 * One event type in the grid. Mirrors Calendly's card: a colored top stripe, the
 * title + duration, a copy-link control, an enable/disable switch, and a kebab
 * menu for edit/delete. Toggle and delete are optimistic via their hooks.
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
    <Card className="flex flex-col overflow-hidden">
      <div className="h-2 w-full" style={{ backgroundColor: eventType.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{eventType.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {eventType.durationMinutes} min · One-on-One
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Event type actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/event-types/${eventType.id}/edit`}>
                  <Pencil className="h-4 w-4" /> Edit
                </Link>
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

        <Link
          href={bookingPath}
          target="_blank"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View booking page
        </Link>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <Switch
            checked={eventType.isActive}
            onCheckedChange={(isActive) => toggle.mutate({ id: eventType.id, isActive })}
            aria-label={eventType.isActive ? 'Disable event type' : 'Enable event type'}
          />
        </div>
      </div>
    </Card>
  );
}
