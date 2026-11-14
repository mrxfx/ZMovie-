import React, { useState } from 'react';
import { Sparkles, Compass, Play, Plus, Check } from 'lucide-react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassButton } from '../components/glass/GlassButton';
import { getMediaDetailRoute, getMediaWatchRoute } from '../components/glass/GlassMovieCard';
import { useLibrary } from '../context/LibraryContext';
import { useSeoMetadata } from '../utils/seo';
import type { MediaSummary } from '../types/media';

interface Vibe {
  id: string;
  name: string;
  icon: string;
  description: string;
  genreIds: number[];
  queryTerms: string[];
}

const VIBES: Vibe[] = [
  {
    id: 'action',
    name: 'Adrenaline & High Stakes',
    icon: '🔥',
    description: 'Heart-pounding action, explosive blockbusters, and relentless survival.',
    genreIds: [28, 12, 53],
    queryTerms: ['Action', 'Mission', 'Fast', 'Revenge'],
  },
  {
    id: 'scifi',
    name: 'Mind-Bending Sci-Fi & Space',
    icon: '🌌',
    description: 'Futuristic worlds, time travel, cosmic mysteries, and dystopian realms.',
    genreIds: [878, 14, 9648],
    queryTerms: ['Space', 'Future', 'Matrix', 'Dune'],
  },
  {
    id: 'thriller',
    name: 'Dark Mystery & Psychological Thriller',
    icon: '🕵️',
    description: 'Twisty plots, detective investigations, and edge-of-your-seat suspense.',
    genreIds: [53, 80, 9648],
    queryTerms: ['Detective', 'Secret', 'Murder', 'Trap'],
  },
  {
    id: 'anime',
    name: 'Epic Anime & Fantasy Adventures',
    icon: '⚔️',
    description: 'Unforgettable journeys, legendary battles, and supernatural awakenings.',
    genreIds: [16, 10759, 14],
    queryTerms: ['Hero', 'Dragon', 'Ninja', 'Titan'],
  },
  {
    id: 'drama',
    name: 'Deep Drama & Inspiring Stories',
    icon: '🎭',
    description: 'Emotional character arcs, powerful performances, and cinematic triumphs.',
    genreIds: [18, 10749],
    queryTerms: ['Life', 'Love', 'Family', 'Dream'],
  },
];

export function MoodMatchPage() {
  useSeoMetadata({
    title: 'AI Mood & Vibe Matcher – ZyvoMovie',
    description: 'Select your mood and instantly discover curated movies, TV shows, and anime tailored to your vibe.',
    path: '/mood',
  });

  const { watchlist, toggleWatchlist } = useLibrary();
  const [selectedVibe, setSelectedVibe] = useState<Vibe>(VIBES[0]);
  const [intensity, setIntensity] = useState<'chill' | 'intense' | 'epic'>('intense');

  const rawCurated = [
    {
      id: 'movie_656908',
      mediaType: 'movie' as const,
      tmdbId: 656908,
      title: selectedVibe.id === 'action' ? 'Ramayana: Rise of a Hero' : selectedVibe.id === 'scifi' ? 'Interstellar Odyssey' : 'The Dark Syndicate',
      releaseYear: '2026',
      voteAverage: 8.4,
      posterPath: 'https://image.tmdb.org/t/p/w500/m4B8N8m6sY2LgN4NqW6gK0tK8l1.jpg',
      overview: selectedVibe.description,
      genres: selectedVibe.queryTerms,
    },
    {
      id: 'movie_822119',
      mediaType: 'movie' as const,
      tmdbId: 822119,
      title: selectedVibe.id === 'action' ? 'Captain Apex' : 'Chronicles of the Void',
      releaseYear: '2025',
      voteAverage: 7.9,
      posterPath: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      overview: 'An epic journey across uncharted dimensions testing the limits of human courage.',
      genres: selectedVibe.queryTerms,
    },
    {
      id: 'tv_1399',
      mediaType: 'tv' as const,
      tmdbId: 1399,
      title: selectedVibe.id === 'action' ? 'Shadow Protocol Series' : 'Realm of Legends',
      releaseYear: '2024',
      voteAverage: 8.7,
      posterPath: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
      overview: 'A critically acclaimed series exploring dark secrets and unbreakable alliances.',
      genres: selectedVibe.queryTerms,
    },
  ];

  const curatedResults: MediaSummary[] = rawCurated.map((item) => ({
    id: item.id,
    mediaType: item.mediaType,
    tmdbId: item.tmdbId,
    title: item.title,
    overview: item.overview,
    posterPath: item.posterPath,
    backdropPath: item.posterPath,
    releaseYear: item.releaseYear,
    releaseDate: `${item.releaseYear}-01-01`,
    voteAverage: item.voteAverage,
    voteCount: 100,
    popularity: 50,
    originalLanguage: 'en',
    genreIds: [1],
    genres: item.genres,
    source: 'tmdb',
  }));

  return (
    <div className="w-full min-w-0 pt-2 pb-16 space-y-8">
      {/* Hero Banner */}
      <GlassPanel variant="default" padding="lg" className="relative overflow-hidden rounded-3xl text-center space-y-4">
        <div className="absolute inset-0 bg-gradient-to-r from-[#E50914]/15 via-transparent to-purple-600/15 pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white">
          <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
          AI Mood &amp; Vibe Curator
        </div>
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          What&apos;s Your Cinematic Vibe Today?
        </h1>
        <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Select a mood below and let our AI-powered curator instantly match you with immersive movies, binge-worthy TV shows, and legendary anime.
        </p>
      </GlassPanel>

      {/* Vibe Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {VIBES.map((vibe) => {
          const isSelected = selectedVibe.id === vibe.id;
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => setSelectedVibe(vibe)}
              className={`text-left p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#E50914]/25 border-2 border-[#E50914] shadow-[0_12px_32px_-8px_rgba(229,9,20,0.45)]'
                  : 'glass-control hover:bg-white/12 border border-white/15'
              }`}
            >
              <div className="space-y-2">
                <span className="text-2xl">{vibe.icon}</span>
                <h3 className="font-display text-sm font-bold text-white leading-snug">{vibe.name}</h3>
                <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">{vibe.description}</p>
              </div>
              <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-semibold text-white/70">
                <span>Curated Vibe</span>
                <Compass className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E50914]' : ''}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Intensity Selector */}
      <GlassPanel variant="subtle" padding="sm" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl">
        <span className="text-xs font-medium text-white/80">Curator Intensity &amp; Depth:</span>
        <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-white/10 border border-white/15">
          {(['chill', 'intense', 'epic'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setIntensity(lvl)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                intensity === lvl
                  ? 'bg-[#E50914] text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* Curated Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-[#E50914]" />
            <h2 className="font-display text-lg font-bold text-white">
              Curated Picks for &ldquo;{selectedVibe.name}&rdquo;
            </h2>
          </div>
          <span className="text-xs font-mono-tabular text-white/60">3 Perfect Matches</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {curatedResults.map((item) => {
            const canonicalId = `${item.mediaType}_${item.tmdbId}`;
            const isSaved = watchlist.some((w) => w.mediaId === canonicalId || w.mediaId === item.id);
            const detailRoute = getMediaDetailRoute(item);
            const watchRoute = getMediaWatchRoute(item);

            return (
              <GlassPanel key={item.id} variant="default" padding="none" className="overflow-hidden rounded-3xl flex flex-col group">
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  <img
                    src={item.posterPath || ''}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono-tabular font-bold text-white flex items-center gap-1">
                    ★ {item.voteAverage}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono-tabular">
                      <span className="uppercase">{item.mediaType}</span>
                      <span>·</span>
                      <span>{item.releaseYear}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-white line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{item.overview}</p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
                    <GlassButton variant="primary" size="sm" to={watchRoute} className="flex-1 min-h-[38px]">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Watch Now
                    </GlassButton>
                    <GlassButton variant="glass" size="sm" to={detailRoute} className="min-h-[38px]">
                      Details
                    </GlassButton>
                    <button
                      type="button"
                      onClick={() => void toggleWatchlist(item)}
                      aria-label="Toggle Watchlist"
                      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                        isSaved ? 'bg-[#E50914] text-white' : 'glass-control text-white hover:bg-white/20'
                      }`}
                    >
                      {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </div>
    </div>
  );
}
