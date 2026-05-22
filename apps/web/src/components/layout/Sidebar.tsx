'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Link2,
  CalendarDays,
  Clock,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** The app's navigable sections. */
const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/event-types', label: 'Scheduling', icon: Link2 },
  { href: '/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/availability', label: 'Availability', icon: Clock },
];

const STORAGE_KEY = 'cal-sidebar-collapsed';

/**
 * Calendly-style left navigation that toggles between an expanded panel (logo +
 * "+ Create" + labelled items) and a narrow icon rail (icon + small label). The
 * collapsed/expanded preference is persisted to localStorage so it survives
 * navigation and reloads. Desktop only — mobile uses the hamburger drawer.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-white py-4 transition-[width] duration-200 md:flex',
        collapsed ? 'w-20 items-center px-2' : 'w-64 px-3',
      )}
    >
      {/* Header: logo + collapse/expand control */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-3">
          <Link href="/event-types" aria-label="Calendly home">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
              <CalendarDays className="h-4 w-4" />
            </span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-brand"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
          <Link
            href="/event-types/new"
            aria-label="Create"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition hover:border-brand hover:text-brand"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-2">
            <Link href="/event-types" className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
                <CalendarDays className="h-4 w-4" />
              </span>
              <span className="text-xl font-bold tracking-tight text-brand">Calendly</span>
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="text-muted-foreground hover:text-brand"
            >
              <ChevronsLeft className="h-5 w-5" />
            </button>
          </div>

          <Link
            href="/event-types/new"
            className="mt-5 flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
          >
            <Plus className="h-4 w-4" /> Create
          </Link>
        </>
      )}

      {/* Nav */}
      <nav className={cn('mt-4 flex w-full flex-col gap-1', collapsed && 'items-center')}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'rounded-lg font-medium transition-colors',
                active ? 'bg-blue-50 text-blue-700' : 'text-foreground hover:bg-gray-50',
                collapsed
                  ? 'flex w-16 flex-col items-center gap-1 px-1 py-2 text-[11px] leading-tight'
                  : 'flex items-center gap-3 px-3 py-2 text-sm',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={cn(collapsed && 'text-center')}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
