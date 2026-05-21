import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

/**
 * Admin shell shared by Event Types, Availability, and Meetings: a persistent
 * sidebar on desktop, a bottom tab bar on mobile, and an off-white content area.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 px-4 pb-20 pt-6 md:px-10 md:pb-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
