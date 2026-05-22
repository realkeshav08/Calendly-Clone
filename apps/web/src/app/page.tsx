import Link from 'next/link';
import { CalendarCheck2, LayoutDashboard, CalendarDays, ArrowRight } from 'lucide-react';

/**
 * App entry page. Auth is intentionally stubbed (a default user is assumed logged
 * in), so the root simply describes the app and offers two doors: the admin
 * dashboard and the public booking page.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
          <CalendarCheck2 className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#0a2540] sm:text-4xl">
          Calendly Clone
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          A full-stack scheduling app. Hosts create event types and set their availability;
          invitees pick a time slot from a timezone-aware calendar to book a meeting — with
          double-booking protection, buffers, and reminders. Authentication is intentionally
          stubbed (a default user is assumed logged in), so you can jump straight into either side.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/event-types"
            className="group flex flex-col rounded-xl border border-border bg-white p-6 text-left shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h2 className="flex items-center gap-1 font-semibold text-foreground">
              Admin Dashboard
              <ArrowRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-0.5" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage event types, availability, and scheduled meetings.
            </p>
          </Link>

          <Link
            href="/demo"
            className="group flex flex-col rounded-xl border border-border bg-white p-6 text-left shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h2 className="flex items-center gap-1 font-semibold text-foreground">
              Public Booking Page
              <ArrowRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-0.5" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Book a meeting as an invitee — no login required.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
