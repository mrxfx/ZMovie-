import React from 'react';
import { Link } from 'react-router-dom';
import { GlassHeader, GlassBottomNavigation } from './glass';
import ambientBackdrop from '../assets/images/hero_cinema_backdrop_1794573963819.jpg';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full max-w-none m-0 text-white flex flex-col">
      {/* Softly Blurred Spatial Ambient Backdrop */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-[#0D0F14]">
        <img
          src={ambientBackdrop}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover scale-110 blur-[26px] brightness-[0.58] saturate-125"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-[#0f131c]/40 to-black/65" />
      </div>

      {/* Full-Width Glass Application Shell */}
      <div className="w-full max-w-none m-0 flex-1 flex flex-col min-h-screen pb-24 sm:pb-28">
        {/* Full-Width Sticky Liquid Glass Top Header */}
        <GlassHeader />

        {/* Full-Width Main Content Area */}
        <main className="w-full max-w-none flex-1 px-4 sm:px-6 lg:px-10 xl:px-12 pb-8 pt-4">
          {children}
        </main>

        {/* Full-Width Frosted Footer with TMDB & Jikan Attribution */}
        <footer className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 pb-6 pt-2">
          <div className="glass-white rounded-3xl px-5 sm:px-8 py-6 sm:py-7">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
              <div className="md:col-span-2 space-y-2.5">
                <Link
                  to="/"
                  className="font-display text-lg font-extrabold tracking-tight inline-flex items-center gap-1.5"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#E50914] text-white text-xs font-black">
                    Z
                  </span>
                  <span>
                    <span className="text-white">Zyvo</span>
                    <span className="text-[#E50914]">Movie</span>
                  </span>
                </Link>
                <p className="text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
                  Part of the Zyvo Ecosystem. Discover trending movies, television series, and
                  anime with synchronized watchlists and instant playback continuity.
                </p>
                <p className="text-[11px] text-white/50">
                  This product uses the TMDB API but is not endorsed or certified by TMDB. Anime
                  metadata adapter powered by MyAnimeList / Jikan API.
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-2.5">
                  Explore
                </h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-white/70">
                  <li>
                    <Link to="/movies" className="hover:text-white transition-colors">
                      Movies
                    </Link>
                  </li>
                  <li>
                    <Link to="/tv" className="hover:text-white transition-colors">
                      TV Shows
                    </Link>
                  </li>
                  <li>
                    <Link to="/anime" className="hover:text-white transition-colors">
                      Anime
                    </Link>
                  </li>
                  <li>
                    <Link to="/continue-watching" className="hover:text-white transition-colors">
                      Continue Watching
                    </Link>
                  </li>
                  <li>
                    <Link to="/history" className="hover:text-white transition-colors">
                      Watch History
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-2.5">
                  Account &amp; Legal
                </h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-white/70">
                  <li>
                    <Link to="/profile" className="hover:text-white transition-colors">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="hover:text-white transition-colors">
                      Settings
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin" className="hover:text-white transition-colors">
                      Admin Panel
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="hover:text-white transition-colors">
                      About ZyvoMovie
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="hover:text-white transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-white/50">
              <span>© {new Date().getFullYear()} Zyvo Ecosystem. All rights reserved.</span>
              <span>ZyvoMovie Liquid Glass</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Centered Floating Liquid Glass Bottom Navigation */}
      <GlassBottomNavigation />
    </div>
  );
}
