import { CalendarCheck2 } from 'lucide-react';

/** Simple Calendly-style footer for the landing page. */
export function MarketingFooter() {
  const columns = [
    { title: 'Product', links: ['Features', 'Integrations', 'Pricing', 'Security'] },
    { title: 'Solutions', links: ['Sales', 'Recruiting', 'Marketing', 'Education'] },
    { title: 'Company', links: ['About us', 'Careers', 'Blog', 'Contact'] },
  ];
  return (
    <footer className="border-t border-border bg-[#0a2540] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-white" />
            <span className="text-lg font-bold">Calendly</span>
          </div>
          <p className="mt-3 text-sm text-white/60">Easy scheduling ahead.</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              {col.links.map((l) => (
                <li key={l} className="cursor-default hover:text-white">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        Calendly clone — built as a take-home demo. Not affiliated with Calendly.
      </div>
    </footer>
  );
}
