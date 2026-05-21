import Link from 'next/link';
import { ArrowRight, CalendarRange, Globe2, Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { HeroMock } from '@/components/marketing/HeroMock';

const FEATURES = [
  {
    icon: CalendarRange,
    title: 'Share your availability',
    body: 'Set your weekly hours once. Invitees only ever see times that actually work for you.',
  },
  {
    icon: Globe2,
    title: 'Timezone intelligence',
    body: 'Every slot is shown in the invitee’s timezone, with DST and half-hour offsets handled correctly.',
  },
  {
    icon: Bell,
    title: 'No double bookings',
    body: 'Conflicts are caught at the database level, so the same slot can never be booked twice.',
  },
];

/** Calendly-style marketing landing page served at the app root. */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-soft/60 to-white" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0a2540] sm:text-5xl">
              Easy scheduling <br /> ahead
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Calendly is the modern scheduling platform that makes “finding time” the easiest part
              of getting things done.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/event-types">
                  Sign up free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link href="/demo">View a demo booking page</Link>
              </Button>
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" /> No credit card required
            </p>
          </div>

          <div className="md:pl-6">
            <HeroMock />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#0a2540]">
          Scheduling automation, built for everyone
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-white p-7 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#0a2540]">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-brand">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Get started in seconds</h2>
          <p className="max-w-xl text-white/80">
            Create event types, set your hours, and share a single link. Your calendar fills itself.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full bg-white px-7 text-brand hover:bg-white/90"
          >
            <Link href="/event-types">
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
