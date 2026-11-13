import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MediaSummary } from '../types/media';
import { MediaCard } from './MediaCard';

export function MediaCarousel({
  title,
  items,
  viewAllTo,
}: {
  title: string;
  items: MediaSummary[];
  viewAllTo?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (!items || items.length === 0) return null;

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = Math.max(320, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#171717] dark:text-zinc-100">
          {title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="text-sm font-medium text-[#737373] dark:text-zinc-400 hover:text-[#E50914] transition-colors mr-1 whitespace-nowrap"
            >
              View All
            </Link>
          )}
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            aria-label={`Scroll ${title} left`}
            className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#171717] dark:text-zinc-200 hover:bg-[#F7F7F8] dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            aria-label={`Scroll ${title} right`}
            className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#171717] dark:text-zinc-200 hover:bg-[#F7F7F8] dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-1"
      >
        {items.map((item) => (
          <div key={item.id} className="w-[155px] sm:w-[180px] md:w-[196px] shrink-0">
            <MediaCard media={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
