'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Link2, CalendarDays, Clock, Plus, ChevronsLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The app's navigable sections. */
const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/event-types', label: 'Scheduling', icon: Link2 },
  { href: '/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/availability', label: 'Availability', icon: Clock },
];

/** Calendly-style left dashboard navigation: logo, "+ Create", and the sections. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white px-3 py-4 md:flex">
      <div className="flex items-center justify-between px-2">
        <Link href="/event-types" className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="text-xl font-bold tracking-tight text-brand">Calendly</span>
        </Link>
        <ChevronsLeft className="h-5 w-5 text-muted-foreground" />
      </div>

      <Link
        href="/event-types/new"
        className="mt-5 flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
      >
        <Plus className="h-4 w-4" /> Create
      </Link>

      <nav className="mt-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-blue-50 text-blue-700' : 'text-foreground hover:bg-gray-50',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
