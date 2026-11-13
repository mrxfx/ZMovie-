import React, { useState } from 'react';
import {
  Bookmark,
  Film,
  Home,
  Search,
  Sparkles,
  Tv,
  User,
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';

const DESKTOP_NAV = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/tv', label: 'TV Shows' },
  { to: '/anime', label: 'Anime' },
  { to: '/my-list', label: 'My List' },
];

const MOBILE_TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv', label: 'TV', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
  { to: '/my-list', label: 'My List', icon: Bookmark },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { watchlist } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D0D0F] text-[#171717] dark:text-zinc-100">
      {/* Desktop Header — strict 3-zone contract */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0D0D0F]/95 backdrop-blur-md border-b border-[#EEEEEE] dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean wordmark */}
          <Link
            to="/"
            className="font-display text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 flex items-center"
          >
            <span className="text-[#171717] dark:text-white">Zyvo</span>
            <span className="text-[#E50914]">Movie</span>
          </Link>

          {/* Zone 2: Desktop single-line navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {DESKTOP_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative py-1 whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#171717] dark:text-white font-semibold after:absolute after:inset-x-0 after:-bottom-[19px] after:h-0.5 after:bg-[#E50914]'
                      : 'text-[#737373] dark:text-zinc-400 hover:text-[#171717] dark:hover:text-white'
                  }`
                }
              >
                {item.label}
                {item.to === '/my-list' && watchlist.length > 0 && (
                  <span className="ml-1.5 text-xs font-mono-tabular text-[#737373] dark:text-zinc-400">
                    ({watchlist.length})
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Desktop Search + Auth/Profile | Mobile Search + Profile icons */}
          <div className="flex items-center gap-3 shrink-0">
            <form
              role="search"
              onSubmit={handleHeaderSearch}
              className="hidden lg:flex items-center relative"
            >
              <label htmlFor="header-search-input" className="sr-only">
                Search movies, TV shows, and anime
              </label>
              <Search className="w-4 h-4 text-[#737373] absolute left-3 pointer-events-none" />
              <input
                id="header-search-input"
                type="search"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                placeholder="Search titles..."
                className="w-52 focus:w-64 transition-all pl-9 pr-3 py-1.5 rounded-lg bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 text-sm text-[#171717] dark:text-zinc-100 placeholder:text-[#737373] focus:outline-none focus:border-[#E50914]"
              />
            </form>

            <Link
              to="/search"
              aria-label="Search titles"
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#171717] dark:text-zinc-200 hover:bg-[#F7F7F8] dark:hover:bg-zinc-800 transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            {user ? (
              <Link
                to="/profile"
                aria-label="User Profile"
                className="inline-flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-[#F7F7F8] dark:bg-zinc-900 hover:border-[#E50914] text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-[#E50914]" />
                )}
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {user.displayName || 'Profile'}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 min-h-[40px] rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-12">{children}</main>

      {/* Quiet Editorial Footer with required TMDB attribution */}
      <footer className="border-t border-[#EEEEEE] dark:border-zinc-800 bg-[#F7F7F8] dark:bg-zinc-950 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <Link to="/" className="font-display text-lg font-extrabold tracking-tight inline-flex">
                <span className="text-[#171717] dark:text-white">Zyvo</span>
                <span className="text-[#E50914]">Movie</span>
              </Link>
              <p className="text-sm text-[#737373] dark:text-zinc-400 max-w-md leading-relaxed">
                Part of the Zyvo Ecosystem. Discover trending movies, television series, and anime with
                synchronized watchlists and progress tracking.
              </p>
              <p className="text-xs text-[#737373] dark:text-zinc-500">
                This product uses the TMDB API but is not endorsed or certified by TMDB. Anime
                metadata adapter powered by MyAnimeList / Jikan API.
              </p>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-[#171717] dark:text-zinc-100 mb-3">
                Explore
              </h3>
              <ul className="space-y-2 text-sm text-[#737373] dark:text-zinc-400">
                <li>
                  <Link to="/movies" className="hover:text-[#E50914] transition-colors">
                    Movies
                  </Link>
                </li>
                <li>
                  <Link to="/tv" className="hover:text-[#E50914] transition-colors">
                    TV Shows
                  </Link>
                </li>
                <li>
                  <Link to="/anime" className="hover:text-[#E50914] transition-colors">
                    Anime
                  </Link>
                </li>
                <li>
                  <Link to="/continue-watching" className="hover:text-[#E50914] transition-colors">
                    Continue Watching
                  </Link>
                </li>
                <li>
                  <Link to="/history" className="hover:text-[#E50914] transition-colors">
                    Watch History
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-[#171717] dark:text-zinc-100 mb-3">
                Account & Legal
              </h3>
              <ul className="space-y-2 text-sm text-[#737373] dark:text-zinc-400">
                <li>
                  <Link to="/profile" className="hover:text-[#E50914] transition-colors">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="hover:text-[#E50914] transition-colors">
                    Settings
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#E50914] transition-colors">
                    About ZyvoMovie
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-[#E50914] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#E50914] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#EEEEEE] dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#737373] dark:text-zinc-500">
            <span>© {new Date().getFullYear()} Zyvo Ecosystem. All rights reserved.</span>
            <span>Pure White + Zyvo Red Edition</span>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Tab Bar (56px height + 48px header = 104px < 15% of 844px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-[#0D0D0F]/95 backdrop-blur-md border-t border-[#EEEEEE] dark:border-zinc-800 grid grid-cols-5 items-center"
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                active
                  ? 'text-[#E50914] font-semibold'
                  : 'text-[#737373] dark:text-zinc-400 hover:text-[#171717] dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
