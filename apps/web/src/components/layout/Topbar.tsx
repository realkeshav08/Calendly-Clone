'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { Skeleton } from '@/components/ui/skeleton';

const NAV_ITEMS = [
  { href: '/event-types', label: 'Event Types' },
  { href: '/meetings', label: 'Meetings' },
  { href: '/availability', label: 'Availability' },
] as const;

/**
 * Desktop admin navigation: a sticky top bar with the logo, horizontal tabs (with
 * an underline active indicator), and the account identity on the right — matching
 * Calendly's current dashboard chrome. Hidden below `md`, where MobileTopbar's
 * hamburger drawer takes over.
 */
export function Topbar() {
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-white md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/event-types" className="flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-brand" />
            <span className="text-xl font-bold tracking-tight text-[#0a2540]">Calendly</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex h-16 items-center px-3 text-sm font-medium transition-colors',
                    active ? 'text-brand' : 'text-foreground hover:text-brand',
                  )}
                >
                  {label}
                  {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {isLoading || !user ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : (
            <>
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
