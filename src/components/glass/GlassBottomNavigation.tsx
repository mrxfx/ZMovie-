import {
  Bookmark,
  Film,
  History,
  Home,
  Search,
  Settings,
  Sparkles,
  Tv,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { GLASS_SPRING } from '../../styles/glassTokens';

const NAV_ITEMS = [
  { to: '/', label: 'Home', mobileLabel: 'Home', icon: Home, exact: true },
  { to: '/movies', label: 'Movies', mobileLabel: 'Movies', icon: Film },
  { to: '/tv', label: 'TV Shows', mobileLabel: 'TV', icon: Tv },
  { to: '/anime', label: 'Anime', mobileLabel: 'Anime', icon: Sparkles },
  { to: '/search', label: 'Search', mobileLabel: 'Search', icon: Search },
  { to: '/my-list', label: 'My List', mobileLabel: 'My List', icon: Bookmark },
  { to: '/history', label: 'History', mobileLabel: 'History', icon: History },
  { to: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings },
];

export function GlassBottomNavigation() {
  const location = useLocation();

  return (
    <nav
      aria-label="Floating Bottom Navigation"
      className="fixed left-1/2 -translate-x-1/2 z-[1000] w-[calc(100vw-16px)] sm:w-[calc(100vw-32px)] lg:w-auto max-w-[96vw] pointer-events-none"
      style={{
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="pointer-events-auto glass-bottom-dock glass-specular rounded-full p-1 sm:p-1.5 grid grid-cols-8 lg:flex lg:items-center lg:gap-1">
        {NAV_ITEMS.map((item) => {
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
              className={`group relative flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-1 sm:px-2 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 min-h-[44px] lg:min-h-[42px] rounded-full bg-transparent transition-all duration-200 whitespace-nowrap select-none min-w-0 ${
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
                <Icon className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
              </motion.span>
              <span className="relative z-10 text-[9px] sm:text-[11px] lg:text-[13px] leading-tight tracking-tight sm:tracking-normal truncate max-w-full">
                <span className="sm:hidden">{item.mobileLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
