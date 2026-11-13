import { AlertCircle, Film, Info, RotateCcw } from 'lucide-react';
import { GlassButton, GlassPanel } from './glass';

export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5"
      aria-label="Loading catalog items"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="animate-pulse">
          <div className="aspect-[2/3] rounded-2xl glass-white" />
          <div className="mt-2.5 h-4 w-4/5 rounded-lg bg-white/10" />
          <div className="mt-1.5 h-3 w-3/5 rounded-lg bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[380px] sm:h-[430px] rounded-3xl glass-surface animate-pulse p-6 sm:p-8 flex flex-col justify-end">
      <div className="max-w-xl space-y-3">
        <div className="h-4 w-32 rounded-full bg-white/15" />
        <div className="h-9 w-3/4 rounded-xl bg-white/15" />
        <div className="h-4 w-full rounded-lg bg-white/15" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-32 rounded-full bg-white/20" />
          <div className="h-10 w-32 rounded-full bg-white/15" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}) {
  return (
    <GlassPanel
      variant="elevated"
      padding="lg"
      className="text-center max-w-xl mx-auto my-8 rounded-3xl"
    >
      <div className="w-12 h-12 rounded-2xl glass-control flex items-center justify-center mx-auto mb-4 text-white">
        <Film className="w-6 h-6 text-[#E50914]" />
      </div>
      <h2 className="font-display text-lg font-bold text-white mb-2">
        {title}
      </h2>
      <p className="text-sm text-white/70 mb-6 leading-relaxed">{description}</p>
      {actionLabel && actionTo && (
        <GlassButton variant="white" to={actionTo}>
          {actionLabel}
        </GlassButton>
      )}
      {actionLabel && onAction && !actionTo && (
        <GlassButton variant="white" onClick={onAction}>
          {actionLabel}
        </GlassButton>
      )}
    </GlassPanel>
  );
}

export function ErrorState({
  title = 'Unable to load content',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <GlassPanel
      role="alert"
      variant="elevated"
      padding="lg"
      className="text-center max-w-xl mx-auto my-8 rounded-3xl"
    >
      <div className="w-11 h-11 rounded-2xl bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/35 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h2 className="font-display text-lg font-bold text-white mb-1.5">
        {title}
      </h2>
      <p className="text-sm text-white/70 mb-5">{message}</p>
      {onRetry && (
        <GlassButton variant="primary" onClick={onRetry}>
          <RotateCcw className="w-4 h-4" />
          Try Again
        </GlassButton>
      )}
    </GlassPanel>
  );
}

export function CatalogNoticeBanner({ notice }: { notice?: string }) {
  if (!notice) return null;
  return (
    <GlassPanel
      role="status"
      variant="subtle"
      padding="sm"
      className="flex items-start gap-3 text-xs sm:text-sm text-white/80"
    >
      <Info className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
      <p className="leading-relaxed">
        <span className="font-semibold text-white">Catalog Notice: </span>
        {notice}
      </p>
    </GlassPanel>
  );
}
