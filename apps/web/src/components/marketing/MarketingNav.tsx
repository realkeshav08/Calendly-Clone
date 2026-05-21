import Link from 'next/link';
import { CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Calendly-style top navigation for the marketing landing page. */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <CalendarCheck2 className="h-6 w-6 text-brand" />
          <span className="text-xl font-bold tracking-tight text-[#0a2540]">Calendly</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#0a2540] md:flex">
          <span className="cursor-default">Product</span>
          <span className="cursor-default">Solutions</span>
          <span className="cursor-default">Enterprise</span>
          <span className="cursor-default">Pricing</span>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden text-[#0a2540] sm:inline-flex">
            <Link href="/event-types">Log in</Link>
          </Button>
          <Button asChild className="rounded-full px-5">
            <Link href="/event-types">Sign up free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
