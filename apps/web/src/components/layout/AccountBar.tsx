'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useMe } from '@/hooks/useMe';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

/**
 * Desktop top-right account control: an avatar + chevron that opens a small
 * account menu. Hidden on mobile, where MobileTopbar carries the identity.
 */
export function AccountBar() {
  const { data: user } = useMe();
  const initial = user?.name.charAt(0).toUpperCase() ?? '·';

  return (
    <div className="hidden h-16 items-center justify-end gap-4 px-6 md:flex">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-foreground">
            {initial}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[14rem]">
          <div className="border-b border-border px-2 py-1.5">
            <p className="text-sm font-semibold text-foreground">{user?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          {user && (
            <DropdownMenuItem asChild>
              <Link href={`/${user.username}`} target="_blank">
                View booking page
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
