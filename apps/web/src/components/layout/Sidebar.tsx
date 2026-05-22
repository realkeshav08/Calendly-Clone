'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Link2,
  CalendarDays,
  Clock,
  Contact,
  Workflow,
  LayoutGrid,
  Route,
  CircleDollarSign,
  BarChart3,
  Crown,
  CircleHelp,
  Plus,
  ChevronsLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Functional nav items (map to the features this app implements). */
const PRIMARY: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/event-types', label: 'Scheduling', icon: Link2 },
  { href: '/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/availability', label: 'Availability', icon: Clock },
];

/** Decorative items — shown for Calendly fidelity, not part of this demo's scope. */
const DECORATIVE: { label: string; icon: LucideIcon }[] = [
  { label: 'Contacts', icon: Contact },
  { label: 'Workflows', icon: Workflow },
  { label: 'Integrations & apps', icon: LayoutGrid },
  { label: 'Routing', icon: Route },
];

const BOTTOM: { label: string; icon: LucideIcon }[] = [
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Admin center', icon: Crown },
  { label: 'Help', icon: CircleHelp },
];

const itemBase =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

/**
 * Calendly's left dashboard navigation. Recreates the real layout: logo, a
 * "+ Create" button, the primary sections, then a muted set of items Calendly
 * shows but this demo doesn't implement (rendered non-interactive so nothing is
 * faked), and a bottom group.
 */
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

      <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
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

        {DECORATIVE.map(({ label, icon: Icon }) => (
          <span
            key={label}
            title="Not part of this demo"
            className={cn(itemBase, 'cursor-default text-foreground/80')}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </span>
        ))}

        <div className="mt-auto flex flex-col gap-1 pt-4">
          <span
            title="Not part of this demo"
            className="mb-1 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-foreground"
          >
            <CircleDollarSign className="h-[18px] w-[18px]" /> Upgrade plan
          </span>
          {BOTTOM.map(({ label, icon: Icon }) => (
            <span
              key={label}
              title="Not part of this demo"
              className={cn(itemBase, 'cursor-default text-foreground/80')}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </span>
          ))}
        </div>
      </nav>
    </aside>
  );
}
