import { useEffect, useState } from 'react';
import {
  Bookmark,
  ChevronRight,
  Clock,
  Film,
  History,
  Home,
  LayoutGrid,
  Search,
  Settings,
  Sparkles,
  Tv,
  User,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { GLASS_SPRING, LIQUID_EASE } from '../../styles/glassTokens';
import { useLibrary } from '../../context/LibraryContext';

const DESKTOP_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv', label: 'TV Shows', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/my-list', label: 'My List', icon: Bookmark },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const MOBILE_PRIMARY_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/search', label: 'Search', icon: Search },
];

const MORE_SHEET_ITEMS = [
  { to: '/tv', label: 'TV Shows', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
  { to: '/my-list', label: 'My List', icon: Bookmark },
  { to: '/continue-watching', label: 'Continue Watching', icon: Clock },
  { to: '/history', label: 'Watch History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function GlassBottomNavigation() {
  const location = useLocation();
  const { watchlist } = useLibrary();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close sheet automatically on route navigation
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Close sheet on Escape key
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const isRouteInMore = MORE_SHEET_ITEMS.some((item) =>
    location.pathname.startsWith(item.to)
  );
  const moreActive = moreOpen || isRouteInMore;

  return (
    <>
      {/* Desktop & Tablet Floating Bottom Navigation (unchanged, >= 768px) */}
      <nav
        aria-label="Floating Bottom Navigation"
        className="hidden md:block fixed left-1/2 -translate-x-1/2 z-[1000] w-[calc(100vw-32px)] lg:w-auto max-w-[96vw] pointer-events-none"
        style={{
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="pointer-events-auto glass-bottom-dock glass-specular rounded-full p-1.5 grid grid-cols-8 lg:flex lg:items-center lg:gap-1">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-2 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 min-h-[44px] lg:min-h-[42px] rounded-full bg-transparent transition-all duration-200 whitespace-nowrap select-none min-w-0 ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-white/[0.78] hover:text-white hover:bg-white/[0.08] font-medium'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="glass-floating-bottom-nav-active"
                    transition={GLASS_SPRING}
                    className="absolute inset-0 rounded-full bg-[#E50914] shadow-[0_6px_22px_-2px_rgba(229,9,20,0.65)] -z-10"
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.06 : 1 }}
                  transition={{ duration: 0.16 }}
                  className={`relative z-10 shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-white/[0.85] group-hover:text-white'
                  }`}
                >
                  <Icon className="w-[17px] h-[17px]" />
                </motion.span>
                <span className="relative z-10 text-[11px] lg:text-[13px] leading-tight truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Floating Bottom Navigation (ONLY 4 items: Home, Movies, Search, More, < 768px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed left-1/2 -translate-x-1/2 z-[1000] w-[calc(100vw-24px)] max-w-[420px] pointer-events-none"
        style={{
          bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="pointer-events-auto glass-bottom-dock glass-specular rounded-full p-1.5 grid grid-cols-4 gap-1 items-center">
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              !moreOpen &&
              (item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMoreOpen(false)}
                className={`group relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-[46px] rounded-full bg-transparent transition-all duration-200 whitespace-nowrap select-none min-w-0 ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-white/[0.78] hover:text-white hover:bg-white/[0.08] font-medium'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="glass-mobile-bottom-nav-active"
                    transition={GLASS_SPRING}
                    className="absolute inset-0 rounded-full bg-[#E50914] shadow-[0_6px_22px_-2px_rgba(229,9,20,0.65)] -z-10"
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.06 : 1 }}
                  transition={{ duration: 0.16 }}
                  className={`relative z-10 shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-white/[0.85] group-hover:text-white'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </motion.span>
                <span className="relative z-10 text-[11px] leading-tight truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            aria-label="More navigation options"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`group relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-[46px] rounded-full bg-transparent transition-all duration-200 whitespace-nowrap select-none min-w-0 cursor-pointer ${
              moreActive
                ? 'text-white font-semibold'
                : 'text-white/[0.78] hover:text-white hover:bg-white/[0.08] font-medium'
            }`}
          >
            {moreActive && (
              <motion.span
                layoutId="glass-mobile-bottom-nav-active"
                transition={GLASS_SPRING}
                className="absolute inset-0 rounded-full bg-[#E50914] shadow-[0_6px_22px_-2px_rgba(229,9,20,0.65)] -z-10"
              />
            )}
            <motion.span
              animate={{ scale: moreActive ? 1.06 : 1 }}
              transition={{ duration: 0.16 }}
              className={`relative z-10 shrink-0 transition-colors ${
                moreActive ? 'text-white' : 'text-white/[0.85] group-hover:text-white'
              }`}
            >
              <LayoutGrid className="w-[18px] h-[18px]" />
            </motion.span>
            <span className="relative z-10 text-[11px] leading-tight truncate max-w-full">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Dark Liquid Glass "More" Bottom Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-[1010] flex flex-col justify-end">
            {/* Scrim Backdrop */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-black/55 backdrop-blur-xs"
            />

            {/* Bottom Sheet Surface */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More ZyvoMovie destinations"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 48, scale: 0.98 }}
              transition={{ duration: 0.24, ease: LIQUID_EASE }}
              className="relative z-[1020] mx-3 glass-bottom-dock glass-specular rounded-3xl p-4 shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
              style={{
                marginBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-3" aria-hidden="true" />

              <div className="flex items-center justify-between gap-3 px-1 pb-3 border-b border-white/15">
                <div>
                  <h2 className="font-display text-base font-bold text-white">Explore &amp; Account</h2>
                  <p className="text-xs text-white/65">ZyvoMovie navigation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-1.5 max-h-[60vh] overflow-y-auto no-scrollbar">
                {MORE_SHEET_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[48px] rounded-2xl transition-all ${
                        active
                          ? 'bg-[#E50914] text-white font-semibold shadow-[0_6px_22px_-2px_rgba(229,9,20,0.55)]'
                          : 'bg-transparent text-white/85 hover:bg-white/[0.09] hover:text-white font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-white/[0.08] border border-white/12 text-white/[0.85]'
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="text-sm truncate">{item.label}</span>
                      </span>

                      <span className="flex items-center gap-2 shrink-0">
                        {item.to === '/my-list' && watchlist.length > 0 && (
                          <span
                            className={`text-[11px] font-mono-tabular px-2 py-0.5 rounded-full leading-tight ${
                              active
                                ? 'bg-white text-[#171717] font-bold'
                                : 'bg-[#E50914] text-white'
                            }`}
                          >
                            {watchlist.length}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 ${active ? 'text-white' : 'text-white/45'}`}
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
