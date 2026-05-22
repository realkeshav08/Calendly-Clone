'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Plus, Link2, CalendarDays, Clock, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/event-types', label: 'Scheduling', icon: Link2 },
  { href: '/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/availability', label: 'Availability', icon: Clock },
];

const itemBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium';

/**
 * Mobile top bar (hamburger on the left, then logo) + slide-in nav drawer that
 * mirrors Calendly's mobile menu: + Create, the primary sections, the decorative
 * items, and a bottom group. Closes on route change, Escape, and backdrop tap.
 */
export function MobileTopbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
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
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-white px-3 md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-foreground hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/event-types" className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
            <CalendarDays className="h-3.5 w-3.5" />
          </span>
          <span className="text-lg font-bold text-brand">Calendly</span>
        </Link>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col overflow-y-auto bg-white px-3 py-4 shadow-xl transition-transform md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="mb-2 w-fit rounded-md p-2 text-muted-foreground hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <Link
          href="/event-types/new"
          className="mb-3 flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground hover:border-brand hover:text-brand"
        >
          <Plus className="h-4 w-4" /> Create
        </Link>

        <nav className="flex flex-col gap-1">
          {PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  itemBase,
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
    </>
  );
}
