import { cn } from '@/lib/utils';

/**
 * Calendly-style loading mark: a slate-blue rounded "link" shape that pulses,
 * mirroring the loader shown in the Calendly dashboard while content loads.
 * Used in place of skeletons on full-page loads.
 */
export function CalendlyLoader({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('flex w-full items-center justify-center py-16', className)}
    >
      <svg width="56" height="22" viewBox="0 0 56 22" fill="#3d5a80" aria-hidden="true">
        <rect className="cl-dot cl-d1" x="0" y="6" width="10" height="10" rx="5" />
        <rect className="cl-dot cl-d2" x="16" y="2" width="24" height="18" rx="9" />
        <rect className="cl-dot cl-d3" x="46" y="6" width="10" height="10" rx="5" />
      </svg>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
