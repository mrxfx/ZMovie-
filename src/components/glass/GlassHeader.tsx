import React, { useState } from 'react';
import { ChevronDown, Clock, Search, User } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { GLASS_SPRING } from '../../styles/glassTokens';
import { PWAInstallButton } from '../PWAComponents';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/tv', label: 'TV Shows' },
  { to: '/anime', label: 'Anime' },
  { to: '/my-list', label: 'My List' },
];

export function GlassHeader() {
  const { user } = useAuth();
  const { watchlist } = useLibrary();
  const navigate = useNavigate();
  const [headerQuery, setHeaderQuery] = useState('');

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = headerQuery.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full px-3.5 sm:px-6 lg:px-10 xl:px-12 py-1.5 md:py-3 bg-[rgba(18,22,29,0.68)] backdrop-blur-2xl saturate-[180%] border-b border-white/15"
      style={{
        paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="w-full min-w-0 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand + Compact VisionOS Search Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            to="/"
            className="font-display text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[44px] md:min-h-0"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-[#E50914] text-white text-xs font-black shadow-[0_6px_16px_-3px_rgba(229,9,20,0.65)]">
              Z
            </span>
            <span>
              <span className="text-white">Zyvo</span>
              <span className="text-[#FF2431] drop-shadow-[0_1px_10px_rgba(229,9,20,0.5)]">
                Movie
              </span>
            </span>
          </Link>

          <form
            role="search"
            onSubmit={handleHeaderSearch}
            className="hidden lg:flex items-center relative"
          >
            <label htmlFor="header-search-input" className="sr-only">
              Search movies, TV shows, and anime
            </label>
            <Search className="w-4 h-4 absolute left-3.5 z-10 pointer-events-none text-white/60" />
            <input
              id="header-search-input"
              type="search"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              placeholder="Search titles..."
              className="w-44 xl:w-56 focus:w-64 transition-all duration-200 pl-9 pr-3.5 py-2 rounded-full bg-white/10 hover:bg-white/14 backdrop-blur-xl border border-white/20 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </form>
        </div>

        {/* Zone 2: Centered Frosted Pill Navigation Bar */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative px-3.5 lg:px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-white/75 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="glass-header-active-pill"
                      transition={GLASS_SPRING}
                      className="absolute inset-0 rounded-full bg-white/24 border border-white/30 shadow-[0_6px_18px_-4px_rgba(0,0,0,0.35)] -z-10"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {item.label}
                    {item.to === '/my-list' && watchlist.length > 0 && (
                      <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded-full bg-[#E50914] text-white leading-none">
                        {watchlist.length}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Quick Actions + Profile Glass Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton variant="header" />

          <Link
            to="/search"
            aria-label="Search titles"
            className="lg:hidden w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-full glass-control text-white/90 hover:text-white transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            to="/continue-watching"
            aria-label="Continue Watching"
            title="Continue Watching"
            className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-full glass-control text-white/85 hover:text-white transition-colors"
          >
            <Clock className="w-4 h-4" />
          </Link>

          {user ? (
            <Link
              to="/profile"
              aria-label="User Profile"
              className="inline-flex items-center justify-center gap-2 p-1.5 sm:pl-1.5 sm:pr-3 sm:py-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-[38px] rounded-full glass-control hover:bg-white/20 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded-full object-cover ring-1 ring-white/50"
                />
              ) : (
                <span className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-[#E50914] flex items-center justify-center text-white">
                  <User className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="hidden sm:inline max-w-[110px] truncate text-white font-medium">
                {user.displayName || 'Profile'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/65 hidden sm:inline" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-1.5 min-h-[44px] md:min-h-[38px] rounded-full bg-[#E50914] hover:bg-[#B20710] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 shadow-[0_8px_20px_-4px_rgba(229,9,20,0.55)] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
