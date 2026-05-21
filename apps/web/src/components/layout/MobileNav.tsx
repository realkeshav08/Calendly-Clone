'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CalendarClock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/event-types', label: 'Events', icon: Calendar },
  { href: '/meetings', label: 'Meetings', icon: CalendarClock },
  { href: '/availability', label: 'Availability', icon: Clock },
] as const;

/** Bottom tab bar shown on mobile (the sidebar is hidden below md). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium',
              active ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
