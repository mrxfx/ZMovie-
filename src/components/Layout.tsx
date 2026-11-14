import React from 'react';
import { Link } from 'react-router-dom';
import { GlassHeader, GlassBottomNavigation } from './glass';
import { OfflineIndicator } from './PWAComponents';
import ambientBackdrop from '../assets/images/hero_cinema_backdrop_1794573963819.jpg';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen min-h-dvh w-full min-w-0 max-w-none m-0 text-white flex flex-col">
      {/* Softly Blurred Spatial Ambient Backdrop (GPU-friendly gradient on mobile, blurred cinema frame on md+) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-[#151922] bg-[radial-gradient(ellipse_at_top,_rgba(229,9,20,0.14)_0%,_rgba(21,25,34,0.92)_48%,_#0d0f14_100%)]">
        <img
          src={ambientBackdrop}
          alt=""
          aria-hidden="true"
          className="hidden md:block w-full h-full object-cover scale-110 blur-[26px] brightness-[0.58] saturate-125"
        />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-black/45 via-[#0f131c]/40 to-black/65" />
      </div>

      {/* Full-Width Glass Application Shell */}
      <div className="w-full min-w-0 max-w-none m-0 flex-1 flex flex-col min-h-screen min-h-dvh pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-28">
        {/* Full-Width Sticky Liquid Glass Top Header */}
        <GlassHeader />

        {/* Full-Width Main Content Area */}
        <main className="w-full min-w-0 max-w-none flex-1 px-3.5 sm:px-6 lg:px-10 xl:px-12 pb-6 sm:pb-8 pt-2.5 sm:pt-4">
          {children}
        </main>

        {/* Full-Width Compact Frosted Footer */}
        <footer className="w-full min-w-0 px-3.5 sm:px-6 lg:px-10 xl:px-12 pb-3 sm:pb-4 pt-1">
          <div className="glass-white rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to="/"
                  className="font-display text-base font-extrabold tracking-tight inline-flex items-center gap-1.5 shrink-0"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#E50914] text-white text-[10px] font-black">
                    Z
                  </span>
                  <span>
                    <span className="text-white">Zyvo</span>
                    <span className="text-[#E50914]">Movie</span>
                  </span>
                </Link>
                <span className="text-xs text-white/60 hidden sm:inline">·</span>
                <p className="text-[11px] sm:text-xs text-white/65 truncate">
                  Immersive entertainment discovery powered by Zyvo Ecosystem.
                </p>
              </div>

              {/* Compact Inline Navigation Links */}
              <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/75 font-medium">
                <Link to="/movies" className="hover:text-white transition-colors">Movies</Link>
                <Link to="/tv" className="hover:text-white transition-colors">TV Shows</Link>
                <Link to="/anime" className="hover:text-white transition-colors">Anime</Link>
                <Link to="/my-list" className="hover:text-white transition-colors">My List</Link>
                <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              </nav>
            </div>

            <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px] text-white/50">
              <span className="truncate">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span>&copy; {new Date().getFullYear()} Zyvo</span>
                <span>·</span>
                <span>Liquid Glass</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Centered Floating Liquid Glass Bottom Navigation */}
      <GlassBottomNavigation />
    </div>
  );
}
