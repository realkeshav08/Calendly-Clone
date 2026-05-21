import { Clock, Video } from 'lucide-react';

/**
 * A static CSS mock of the booking widget, used as the hero illustration. It
 * signals "this is Calendly" without shipping a screenshot image — a mini left
 * info panel plus a month grid with a few highlighted available days and times.
 */
export function HeroMock() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2); // leading blanks then 1..31-ish
  const available = new Set([8, 9, 10, 15, 16, 17, 22, 23]);
  const selected = 16;
  const times = ['9:00am', '9:30am', '10:00am', '10:30am'];

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-2xl shadow-blue-900/10">
      <div className="grid grid-cols-[140px_1fr_120px] gap-4">
        {/* Left info panel */}
        <div className="border-r border-border pr-4">
          <div className="mb-2 h-8 w-8 rounded-full bg-brand" />
          <p className="text-[10px] text-muted-foreground">Demo User</p>
          <p className="text-sm font-bold leading-tight text-foreground">30 Minute Meeting</p>
          <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
            <p className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> 30 min
            </p>
            <p className="flex items-center gap-1">
              <Video className="h-3 w-3" /> Web conferencing
            </p>
          </div>
        </div>

        {/* Mini calendar */}
        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">May 2026</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-muted-foreground">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
            {days.map((n, i) => {
              const valid = n >= 1 && n <= 31;
              const isAvail = available.has(n);
              const isSel = n === selected;
              return (
                <span
                  key={i}
                  className={[
                    'flex h-5 w-5 items-center justify-center rounded-full text-[9px]',
                    !valid ? 'text-transparent' : '',
                    isSel ? 'bg-brand font-bold text-white' : '',
                    isAvail && !isSel ? 'bg-brand-soft font-bold text-brand' : '',
                    valid && !isAvail && !isSel ? 'text-gray-300' : '',
                  ].join(' ')}
                >
                  {valid ? n : '·'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-foreground">Fri 16</p>
          {times.map((t) => (
            <div
              key={t}
              className="rounded-md border border-brand/40 py-1.5 text-center text-[10px] font-semibold text-brand"
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
