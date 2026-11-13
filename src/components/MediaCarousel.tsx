import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MediaSummary } from '../types/media';
import { GlassMovieCard } from './glass';

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
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-5 rounded-full bg-[#E50914] shrink-0" aria-hidden="true" />
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="px-3.5 py-1.5 rounded-full glass-control text-xs font-medium text-white/85 hover:text-white hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              See all
            </Link>
          )}
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            aria-label={`Scroll ${title} left`}
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full glass-control text-white/85 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            aria-label={`Scroll ${title} right`}
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full glass-control text-white/85 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-0.5"
      >
        {items.map((item) => (
          <div key={item.id} className="w-[155px] sm:w-[175px] md:w-[190px] xl:w-[205px] shrink-0">
            <GlassMovieCard media={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
