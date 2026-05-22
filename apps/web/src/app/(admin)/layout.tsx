import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTopbar } from '@/components/layout/MobileTopbar';
import { AccountBar } from '@/components/layout/AccountBar';

/**
 * Admin shell modeled on Calendly's dashboard: a left sidebar on desktop with a
 * top-right account bar, and a hamburger top bar + drawer on mobile.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileTopbar />
        <AccountBar />
        <main className="flex-1 px-4 pb-12 pt-4 md:px-10 md:pt-0">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
