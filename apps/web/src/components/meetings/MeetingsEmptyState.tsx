import { Calendar } from 'lucide-react';

/**
 * Calendly-style empty state for the meetings tabs: a muted calendar glyph with a
 * "0" badge and a section-specific message (e.g. "No Upcoming Events").
 */
export function MeetingsEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-5">
        <Calendar className="h-16 w-16 text-gray-300" strokeWidth={1.5} />
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-xs font-semibold text-white">
          0
        </span>
      </div>
      <p className="text-lg font-semibold text-slate-500">{label}</p>
    </div>
  );
}
