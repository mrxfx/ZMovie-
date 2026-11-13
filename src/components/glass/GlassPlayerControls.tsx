import { Check, ChevronLeft, ChevronRight, Subtitles } from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { GlassButton } from './GlassButton';
import type { MediaType, VidLinkIconsStyle, VidLinkPlayerType } from '../../types/media';

export interface GlassPlayerControlsProps {
  mediaType: MediaType;
  playerType: VidLinkPlayerType;
  onPlayerTypeChange: (mode: VidLinkPlayerType) => void;
  iconStyle: VidLinkIconsStyle;
  onIconStyleChange: (style: VidLinkIconsStyle) => void;
  animeAudio: 'sub' | 'dub';
  onAnimeAudioChange: (audio: 'sub' | 'dub') => void;
  animeFallback: boolean;
  onAnimeFallbackChange: (fallback: boolean) => void;
  showSubtitlesPanel: boolean;
  onToggleSubtitlesPanel: () => void;
  subtitleInput: string;
  onSubtitleInputChange: (url: string) => void;
  subtitleLabelInput: string;
  onSubtitleLabelInputChange: (label: string) => void;
  fallbackUrlInput: string;
  onFallbackUrlInputChange: (url: string) => void;
  onApplySubtitleAndFallback: (e: React.FormEvent) => void;
  subtitleError?: string | null;
  season?: number;
  episode?: number;
  seasons?: { id: number; seasonNumber: number; name: string }[];
  maxEpisodes?: number;
  onSeasonChange?: (season: number) => void;
  onEpisodeChange?: (episode: number) => void;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  lastPlaybackStats?: {
    event: string;
    progressPercent: number;
  } | null;
}

export function GlassPlayerControls({
  mediaType,
  playerType,
  onPlayerTypeChange,
  iconStyle,
  onIconStyleChange,
  animeAudio,
  onAnimeAudioChange,
  animeFallback,
  onAnimeFallbackChange,
  showSubtitlesPanel,
  onToggleSubtitlesPanel,
  subtitleInput,
  onSubtitleInputChange,
  subtitleLabelInput,
  onSubtitleLabelInputChange,
  fallbackUrlInput,
  onFallbackUrlInputChange,
  onApplySubtitleAndFallback,
  subtitleError,
  season = 1,
  episode = 1,
  seasons = [],
  maxEpisodes = 24,
  onSeasonChange,
  onEpisodeChange,
  onPrevEpisode,
  onNextEpisode,
  lastPlaybackStats,
}: GlassPlayerControlsProps) {
  return (
    <GlassPanel variant="default" padding="md" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#E50914]" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-white">
            Playback & VidLink Controls
          </h2>
        </div>
        {lastPlaybackStats && (
          <span className="px-3 py-1 rounded-full glass-control text-xs font-mono-tabular text-white/80">
            Last event: {lastPlaybackStats.event} · {lastPlaybackStats.progressPercent.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Engine & Icon Controls + Subtitles toggle */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-white/65">
              Player Engine
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
              {(
                [
                  { id: 'default', label: 'Default Player' },
                  { id: 'jw', label: 'JW Player' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPlayerTypeChange(opt.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    playerType === opt.id
                      ? 'bg-[#E50914] text-white shadow-sm'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-white/65">
              Icon Theme
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
              {(
                [
                  { id: 'default', label: 'Default Icons' },
                  { id: 'vid', label: 'Vid Icons' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onIconStyleChange(opt.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    iconStyle === opt.id
                      ? 'bg-[#E50914] text-white shadow-sm'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <GlassButton
          variant={showSubtitlesPanel ? 'primary' : 'glass'}
          size="sm"
          onClick={onToggleSubtitlesPanel}
        >
          <Subtitles className="w-3.5 h-3.5" />
          Subtitles & Fallback
        </GlassButton>
      </div>

      {/* TV / Anime Episode Navigation & Audio Controls */}
      {(mediaType === 'tv' || mediaType === 'anime') && (
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/15">
          {mediaType === 'tv' && seasons.length > 0 && onSeasonChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="player-season" className="text-xs font-medium text-white/65">
                Season
              </label>
              <select
                id="player-season"
                value={season}
                onChange={(e) => onSeasonChange(Number(e.target.value))}
                className="px-3.5 py-2 rounded-full glass-control text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-white/40"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.seasonNumber}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onEpisodeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="player-episode" className="text-xs font-medium text-white/65">
                Episode
              </label>
              <select
                id="player-episode"
                value={episode}
                onChange={(e) => onEpisodeChange(Number(e.target.value))}
                className="px-3.5 py-2 rounded-full glass-control text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-white/40"
              >
                {Array.from({ length: maxEpisodes }, (_, i) => i + 1).map((epNum) => (
                  <option key={epNum} value={epNum}>
                    Episode {epNum}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mediaType === 'anime' && (
            <>
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
                {(['sub', 'dub'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onAnimeAudioChange(mode)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase transition-all cursor-pointer ${
                      animeAudio === mode
                        ? 'bg-[#E50914] text-white shadow-sm'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onAnimeFallbackChange(!animeFallback)}
                aria-pressed={animeFallback}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  animeFallback
                    ? 'bg-[#E50914]/25 border-[#E50914]/60 text-white'
                    : 'glass-control text-white/75'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${animeFallback ? 'opacity-100' : 'opacity-35'}`} />
                Auto-fallback Sub/Dub
              </button>
            </>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onPrevEpisode && (
              <GlassButton
                variant="glass"
                size="sm"
                disabled={episode <= 1}
                onClick={onPrevEpisode}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev Ep
              </GlassButton>
            )}
            {onNextEpisode && (
              <GlassButton
                variant="primary"
                size="sm"
                disabled={episode >= maxEpisodes}
                onClick={onNextEpisode}
              >
                Next Ep
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            )}
          </div>
        </div>
      )}

      {/* External Subtitle & Fallback Configuration */}
      {showSubtitlesPanel && (
        <form
          onSubmit={onApplySubtitleAndFallback}
          className="space-y-3 pt-4 border-t border-white/15"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-3">
              <label htmlFor="external-subtitle-url" className="sr-only">
                External Subtitle URL
              </label>
              <input
                id="external-subtitle-url"
                type="url"
                value={subtitleInput}
                onChange={(e) => onSubtitleInputChange(e.target.value)}
                placeholder="https://example.com/subtitles.vtt"
                className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
              />
            </div>
            <div>
              <label htmlFor="external-subtitle-label" className="sr-only">
                Subtitle Label
              </label>
              <input
                id="external-subtitle-label"
                type="text"
                maxLength={40}
                value={subtitleLabelInput}
                onChange={(e) => onSubtitleLabelInputChange(e.target.value)}
                placeholder="English"
                className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <label htmlFor="external-fallback-url" className="sr-only">
              Fallback Redirect URL
            </label>
            <input
              id="external-fallback-url"
              type="url"
              value={fallbackUrlInput}
              onChange={(e) => onFallbackUrlInputChange(e.target.value)}
              placeholder="Optional fallback redirect URL (https://...)"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
            />
            <GlassButton type="submit" variant="primary" size="md">
              Apply Options
            </GlassButton>
          </div>
          {subtitleError && <p className="text-xs text-[#E50914] font-medium">{subtitleError}</p>}
        </form>
      )}
    </GlassPanel>
  );
}
