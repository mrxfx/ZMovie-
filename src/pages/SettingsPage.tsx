import { useEffect, useState } from 'react';
import { CheckCircle2, Moon, Sun, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { fetchApiStatus } from '../services/catalogApi';
import { GlassButton, GlassPanel } from '../components/glass';
import { useSeoMetadata } from '../utils/seo';

export function SettingsPage() {
  useSeoMetadata({
    title: 'Settings – ZyvoMovie',
    description: 'Configure appearance, language, playback defaults, and privacy controls on ZyvoMovie.',
    path: '/settings',
  });

  const {
    preferences,
    updatePreferences,
    clearSearchHistory,
    clearHistory,
    searchHistory,
    history,
  } = useLibrary();

  const [statusInfo, setStatusInfo] = useState<{
    tmdbConfigured: boolean;
    animeProvider: string;
    streamingProvider: string;
  } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    void fetchApiStatus()
      .then((res) => setStatusInfo(res))
      .catch(() => {});
  }, []);

  const applyPatch = async (patch: Parameters<typeof updatePreferences>[0]) => {
    await updatePreferences(patch);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="w-full pt-2 space-y-6">
      <GlassPanel variant="default" padding="md" className="rounded-3xl flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Settings
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Customize appearance, playback behavior, and privacy preferences.
          </p>
        </div>
        {savedNotice && (
          <span className="px-3 py-1 rounded-full glass-control inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
      </GlassPanel>

      {/* Appearance */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-4">
        <h2 className="font-display text-lg font-bold text-white">Appearance</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Glass Theme Intensity</p>
            <p className="text-xs text-white/65">
              Switch between balanced Spatial Glass and Deeper Smoked Dark Glass.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
            <button
              type="button"
              onClick={() => void applyPatch({ theme: 'light' })}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                preferences.theme === 'light'
                  ? 'bg-[#E50914] text-white shadow-sm'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Spatial Glass
            </button>
            <button
              type="button"
              onClick={() => void applyPatch({ theme: 'dark' })}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                preferences.theme === 'dark'
                  ? 'bg-[#E50914] text-white shadow-sm'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Deep Glass
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Playback & Language */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-5">
        <h2 className="font-display text-lg font-bold text-white">Language &amp; Playback</h2>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <label htmlFor="pref-language" className="text-sm font-semibold text-white">
              Preferred Metadata Language
            </label>
            <p className="text-xs text-white/65">
              Used for catalog localization when supported.
            </p>
          </div>
          <select
            id="pref-language"
            value={preferences.language}
            onChange={(e) => void applyPatch({ language: e.target.value })}
            className="px-3.5 py-2 rounded-full glass-control text-sm text-white focus:outline-none focus:border-white/45"
          >
            <option value="en-US">English (US)</option>
            <option value="ja-JP">Japanese</option>
            <option value="ko-KR">Korean</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
          <div>
            <p className="text-sm font-semibold text-white">Default Anime Audio</p>
            <p className="text-xs text-white/65">
              Choose Subtitled (SUB) or Dubbed (DUB) by default in the anime player.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
            {(['sub', 'dub'] as const).map((audio) => (
              <button
                key={audio}
                type="button"
                onClick={() => void applyPatch({ preferredAnimeAudio: audio })}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase transition-all cursor-pointer ${
                  preferences.preferredAnimeAudio === audio
                    ? 'bg-[#E50914] text-white shadow-sm'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {audio}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/15">
          <div>
            <p className="text-sm font-semibold text-white">Auto-advance Next Episode Prompt</p>
            <p className="text-xs text-white/65">
              Show next-episode controls inside supported series players.
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="Auto-advance Next Episode Prompt"
            checked={preferences.autoplayNext}
            onChange={(e) => void applyPatch({ autoplayNext: e.target.checked })}
            className="w-5 h-5 accent-[#E50914]"
          />
        </div>
      </GlassPanel>

      {/* Privacy & History */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-5">
        <h2 className="font-display text-lg font-bold text-white">Privacy &amp; History</h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Save Search History</p>
            <p className="text-xs text-white/65">
              Remember recent queries locally for quick search access.
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="Save Search History"
            checked={preferences.saveSearchHistory}
            onChange={(e) => void applyPatch({ saveSearchHistory: e.target.checked })}
            className="w-5 h-5 accent-[#E50914]"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/15">
          <div>
            <p className="text-sm font-semibold text-white">Save Watch History</p>
            <p className="text-xs text-white/65">
              Log titles launched in the watch player.
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="Save Watch History"
            checked={preferences.saveWatchHistory}
            onChange={(e) => void applyPatch({ saveWatchHistory: e.target.checked })}
            className="w-5 h-5 accent-[#E50914]"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/15">
          <GlassButton
            variant="glass"
            size="sm"
            disabled={searchHistory.length === 0}
            onClick={clearSearchHistory}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Search History ({searchHistory.length})
          </GlassButton>

          <GlassButton
            variant="glass"
            size="sm"
            disabled={history.length === 0}
            onClick={() => void clearHistory()}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Watch History ({history.length})
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Integration Status */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-3">
        <h2 className="font-display text-lg font-bold text-white">Provider Integration Status</h2>
        <dl className="text-sm space-y-2.5 text-white/65">
          <div className="flex justify-between gap-4">
            <dt>TMDB Server Read Access Token</dt>
            <dd className="font-semibold text-white">
              {statusInfo
                ? statusInfo.tmdbConfigured
                  ? 'Configured (Server-side)'
                  : 'Not Configured (Set TMDB_READ_ACCESS_TOKEN)'
                : 'Checking...'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Anime Metadata Adapter</dt>
            <dd className="font-semibold text-white">
              MyAnimeList / Jikan v4 (Separate MAL IDs)
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Streaming Embed Adapter</dt>
            <dd className="font-semibold text-white">
              VidLink Pro (Default &amp; JW Player)
            </dd>
          </div>
          <div className="flex justify-between gap-4 pt-2 border-t border-white/15">
            <dt>Catalog Publishing Studio</dt>
            <dd>
              <Link to="/admin" className="font-semibold text-[#E50914] hover:underline">
                Open Admin Panel
              </Link>
            </dd>
          </div>
        </dl>
      </GlassPanel>
    </div>
  );
}
