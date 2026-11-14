import React from 'react';
import { BarChart3, Clock, Film, History, Trophy, Tv, Zap, ArrowLeft } from 'lucide-react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassButton } from '../components/glass/GlassButton';
import { useLibrary } from '../context/LibraryContext';
import { useSeoMetadata } from '../utils/seo';
import { formatPlaybackTime } from '../utils/watchProgress';

export function WatchStatsPage() {
  useSeoMetadata({
    title: 'Watch Analytics & Statistics – ZyvoMovie',
    description: 'Explore your viewing analytics, watch time, genre distribution, and streaming milestones on ZyvoMovie.',
    path: '/stats',
  });

  const { watchlist, watchProgress, history } = useLibrary();

  const totalWatchtimeSeconds = watchProgress.reduce((acc, p) => acc + (p.currentTime || 0), 0);
  const completedCount = watchProgress.filter((p) => p.completed || p.progressPercent >= 90).length;
  const moviesCount = watchlist.filter((w) => w.mediaType === 'movie').length;
  const tvCount = watchlist.filter((w) => w.mediaType === 'tv').length;
  const animeCount = watchlist.filter((w) => w.mediaType === 'anime').length;

  return (
    <div className="w-full min-w-0 pt-2 pb-16 space-y-8">
      {/* Header */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/18 text-xs font-semibold text-white">
            <BarChart3 className="w-3.5 h-3.5 text-[#E50914]" />
            Personal Entertainment Analytics
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Your Watch Statistics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300">
            Real-time insights into your viewing habits, progress, and library activity.
          </p>
        </div>
        <GlassButton variant="glass" size="md" to="/profile" className="w-full md:w-auto min-h-[42px]">
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </GlassButton>
      </GlassPanel>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel variant="default" padding="md" className="rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-white/65">
            <span className="text-xs font-medium">Total Watch Time</span>
            <Clock className="w-4 h-4 text-[#E50914]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-white font-mono-tabular">
            {formatPlaybackTime(totalWatchtimeSeconds)}
          </div>
          <p className="text-[11px] text-zinc-400">Across {watchProgress.length} active checkpoints</p>
        </GlassPanel>

        <GlassPanel variant="default" padding="md" className="rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-white/65">
            <span className="text-xs font-medium">Completed Titles</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-white font-mono-tabular">
            {completedCount}
          </div>
          <p className="text-[11px] text-zinc-400">Finished &ge; 90% duration</p>
        </GlassPanel>

        <GlassPanel variant="default" padding="md" className="rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-white/65">
            <span className="text-xs font-medium">My List Saved</span>
            <Film className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-white font-mono-tabular">
            {watchlist.length}
          </div>
          <p className="text-[11px] text-zinc-400">Movies, series &amp; anime bookmarked</p>
        </GlassPanel>

        <GlassPanel variant="default" padding="md" className="rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-white/65">
            <span className="text-xs font-medium">History Logged</span>
            <History className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-white font-mono-tabular">
            {history.length}
          </div>
          <p className="text-[11px] text-zinc-400">Total viewing sessions recorded</p>
        </GlassPanel>
      </div>

      {/* Media Type Breakdown */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-[#E50914]" />
          <h2 className="font-display text-lg font-bold text-white">Library Category Distribution</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl glass-control border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-sm text-white">
              <span className="font-medium flex items-center gap-2"><Film className="w-4 h-4 text-[#E50914]" /> Movies</span>
              <span className="font-mono-tabular font-bold">{moviesCount}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#E50914] rounded-full"
                style={{ width: `${watchlist.length ? (moviesCount / watchlist.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-control border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-sm text-white">
              <span className="font-medium flex items-center gap-2"><Tv className="w-4 h-4 text-blue-400" /> TV Shows</span>
              <span className="font-mono-tabular font-bold">{tvCount}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${watchlist.length ? (tvCount / watchlist.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-control border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-sm text-white">
              <span className="font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> Anime</span>
              <span className="font-mono-tabular font-bold">{animeCount}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${watchlist.length ? (animeCount / watchlist.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
