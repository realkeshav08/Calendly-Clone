'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Calendar, CalendarClock, Clock, CalendarCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';

const NAV_ITEMS = [
  { href: '/event-types', label: 'Event Types', icon: Calendar },
  { href: '/meetings', label: 'Scheduled Events', icon: CalendarClock },
  { href: '/availability', label: 'Availability', icon: Clock },
] as const;

/**
 * Mobile-only top bar with a hamburger that opens a slide-in nav drawer (the
 * desktop sidebar is hidden below `md`). The drawer closes on route change, on
 * Escape, and when the backdrop is tapped.
 */
export function MobileTopbar() {
  const pathname = usePathname();
  const { data: user } = useMe();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4 md:hidden">
        <Link href="/event-types" className="flex items-center gap-2">
          <CalendarCheck2 className="h-5 w-5 text-brand" />
          <span className="font-bold text-[#0a2540]">Calendly</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-foreground hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-white shadow-xl transition-transform md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-label="Navigation"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
              {user ? user.name.charAt(0).toUpperCase() : '·'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.name ?? 'Loading…'}
              </p>
              {user && <p className="truncate text-xs text-muted-foreground">@{user.username}</p>}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-md p-2 text-muted-foreground hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-blue-50 text-blue-700' : 'text-foreground hover:bg-gray-50',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
