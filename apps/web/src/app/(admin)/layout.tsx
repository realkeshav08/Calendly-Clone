import { Topbar } from '@/components/layout/Topbar';
import { MobileTopbar } from '@/components/layout/MobileTopbar';

/**
 * Admin shell shared by Event Types, Meetings, and Availability: Calendly-style
 * top navigation on desktop (logo + tabs + account), a hamburger top bar + drawer
 * on mobile, and a centered off-white content area.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MobileTopbar />
      <Topbar />
      <main className="px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
