'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CalendarClock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { Skeleton } from '@/components/ui/skeleton';

const NAV_ITEMS = [
  { href: '/event-types', label: 'Event Types', icon: Calendar },
  { href: '/meetings', label: 'Scheduled Events', icon: CalendarClock },
  { href: '/availability', label: 'Availability', icon: Clock },
] as const;

/**
 * Calendly-style left navigation: fixed ~240px column with the user identity at
 * the top and the three primary sections below. The active route is highlighted
 * with the soft-blue / blue-text treatment Calendly uses.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          {user ? user.name.charAt(0).toUpperCase() : '·'}
        </div>
        <div className="min-w-0">
          {isLoading || !user ? (
            <>
              <Skeleton className="mb-1 h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </>
          ) : (
            <>
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            </>
          )}
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-foreground hover:bg-gray-50 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
