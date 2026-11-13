import React, { useState } from 'react';
import { Clock, Search, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LIQUID_EASE } from '../../styles/glassTokens';

export interface GlassSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  onClear?: () => void;
  placeholder?: string;
  recentSearches?: string[];
  quickSuggestions?: string[];
  onSelectSuggestion?: (term: string) => void;
  size?: 'compact' | 'hero';
  autoFocus?: boolean;
  className?: string;
}

export function GlassSearch({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search movies, TV shows, anime...',
  recentSearches = [],
  quickSuggestions = [],
  onSelectSuggestion,
  size = 'hero',
  autoFocus = false,
  className = '',
}: GlassSearchProps) {
  const [focused, setFocused] = useState(false);

  const showDropdown =
    focused &&
    !value.trim() &&
    (recentSearches.length > 0 || quickSuggestions.length > 0) &&
    Boolean(onSelectSuggestion);

  return (
    <div className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          setFocused(false);
          onSubmit?.(e);
        }}
        className={`relative flex items-center glass-control glass-specular transition-all duration-200 rounded-full ${
          focused
            ? 'ring-2 ring-white/30 border-white/40 bg-white/18'
            : ''
        }`}
      >
        <label htmlFor={`glass-search-${size}`} className="sr-only">
          {placeholder}
        </label>
        <Search
          className={`pointer-events-none shrink-0 transition-colors ${
            size === 'hero' ? 'w-5 h-5 ml-4' : 'w-4 h-4 ml-3.5'
          } ${focused ? 'text-white' : 'text-white/60'}`}
        />
        <input
          id={`glass-search-${size}`}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 160);
          }}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent text-white placeholder:text-white/55 focus:outline-none ${
            size === 'hero' ? 'px-3.5 py-3.5 text-base' : 'px-2.5 py-2 text-sm'
          }`}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="mr-2 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {size === 'hero' && (
          <button
            type="submit"
            className="mr-1.5 px-5 py-2 rounded-full bg-[#E50914] hover:bg-[#B20710] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            Search
          </button>
        )}
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: LIQUID_EASE }}
            className="absolute left-0 right-0 top-full mt-2 z-30 glass-elevated rounded-3xl p-4 space-y-4"
          >
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-2">
                  <Clock className="w-3.5 h-3.5 text-[#E50914]" />
                  Recent Searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectSuggestion?.(item);
                        setFocused(false);
                      }}
                      className="px-3 py-1.5 rounded-full glass-control text-xs font-medium text-white/90 hover:bg-white/22 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
                  Trending Queries
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectSuggestion?.(item);
                        setFocused(false);
                      }}
                      className="px-3 py-1.5 rounded-full glass-control text-xs font-medium text-white/90 hover:bg-white/22 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
