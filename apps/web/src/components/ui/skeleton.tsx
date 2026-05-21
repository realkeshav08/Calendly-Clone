import { cn } from '@/lib/utils';

/** Pulsing placeholder shown while data loads. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} {...props} />;
}

export { Skeleton };
