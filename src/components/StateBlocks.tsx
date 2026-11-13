import { AlertCircle, Film, Info, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
      aria-label="Loading catalog items"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-[#F7F7F8] dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-800" />
          <div className="mt-2.5 h-4 w-4/5 rounded bg-[#F7F7F8] dark:bg-zinc-800" />
          <div className="mt-1.5 h-3 w-3/5 rounded bg-[#F7F7F8] dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[460px] md:h-[540px] rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 animate-pulse p-8 flex flex-col justify-end">
      <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 mb-3" />
      <div className="h-10 w-2/3 max-w-md rounded bg-zinc-200 dark:bg-zinc-800 mb-3" />
      <div className="h-4 w-full max-w-xl rounded bg-zinc-200 dark:bg-zinc-800 mb-6" />
      <div className="flex gap-3">
        <div className="h-11 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-11 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
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
    <div className="bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 rounded-2xl p-10 text-center max-w-xl mx-auto my-8">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 flex items-center justify-center mx-auto mb-4 text-[#737373] dark:text-zinc-400">
        <Film className="w-6 h-6" />
      </div>
      <h2 className="font-display text-lg font-bold text-[#171717] dark:text-zinc-100 mb-2">
        {title}
      </h2>
      <p className="text-sm text-[#737373] dark:text-zinc-400 mb-6 leading-relaxed">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
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
    <div
      role="alert"
      className="bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 rounded-2xl p-8 text-center max-w-xl mx-auto my-8"
    >
      <div className="w-11 h-11 rounded-xl bg-[#E50914]/10 text-[#E50914] flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h2 className="font-display text-lg font-bold text-[#171717] dark:text-zinc-100 mb-1.5">
        {title}
      </h2>
      <p className="text-sm text-[#737373] dark:text-zinc-400 mb-5">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function CatalogNoticeBanner({ notice }: { notice?: string }) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 text-xs sm:text-sm text-[#737373] dark:text-zinc-300"
    >
      <Info className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
      <p className="leading-relaxed">
        <span className="font-semibold text-[#171717] dark:text-zinc-100">Catalog Notice: </span>
        {notice}
      </p>
    </div>
  );
}
