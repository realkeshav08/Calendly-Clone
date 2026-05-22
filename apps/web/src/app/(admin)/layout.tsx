import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTopbar } from '@/components/layout/MobileTopbar';

/**
 * Admin shell shared by Event Types, Availability, and Meetings: a persistent
 * sidebar on desktop, a hamburger top bar + slide-in drawer on mobile, and an
 * off-white content area.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MobileTopbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 pb-10 pt-6 md:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
