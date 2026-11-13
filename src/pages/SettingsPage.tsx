import { useEffect, useState } from 'react';
import { CheckCircle2, Moon, Sun, Trash2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { fetchApiStatus } from '../services/catalogApi';
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
      <div className="border-b border-[#EEEEEE] dark:border-zinc-800 pb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-[#737373] dark:text-zinc-400 mt-1">
            Customize appearance, playback behavior, and privacy preferences.
          </p>
        </div>
        {savedNotice && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
      </div>

      {/* Appearance */}
      <section className="p-6 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-4">
        <h2 className="font-display text-lg font-bold">Appearance</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Theme</p>
            <p className="text-xs text-[#737373] dark:text-zinc-400">
              ZyvoMovie defaults to Pure White & Zyvo Red. Dark mode is optional.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-[#EEEEEE] dark:border-zinc-700">
            <button
              type="button"
              onClick={() => void applyPatch({ theme: 'light' })}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                preferences.theme === 'light'
                  ? 'bg-[#E50914] text-white'
                  : 'text-[#737373] dark:text-zinc-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Pure White
            </button>
            <button
              type="button"
              onClick={() => void applyPatch({ theme: 'dark' })}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                preferences.theme === 'dark'
                  ? 'bg-[#E50914] text-white'
                  : 'text-[#737373] dark:text-zinc-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark Mode
            </button>
          </div>
        </div>
      </section>

      {/* Playback & Language */}
      <section className="p-6 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-5">
        <h2 className="font-display text-lg font-bold">Language & Playback</h2>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <label htmlFor="pref-language" className="text-sm font-semibold">
              Preferred Metadata Language
            </label>
            <p className="text-xs text-[#737373] dark:text-zinc-400">
              Used for catalog localization when supported.
            </p>
          </div>
          <select
            id="pref-language"
            value={preferences.language}
            onChange={(e) => void applyPatch({ language: e.target.value })}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm"
          >
            <option value="en-US">English (US)</option>
            <option value="ja-JP">Japanese</option>
            <option value="ko-KR">Korean</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#EEEEEE] dark:border-zinc-800">
          <div>
            <p className="text-sm font-semibold">Default Anime Audio</p>
            <p className="text-xs text-[#737373] dark:text-zinc-400">
              Choose Subtitled (SUB) or Dubbed (DUB) by default in the anime player.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-[#EEEEEE] dark:border-zinc-700">
            {(['sub', 'dub'] as const).map((audio) => (
              <button
                key={audio}
                type="button"
                onClick={() => void applyPatch({ preferredAnimeAudio: audio })}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                  preferences.preferredAnimeAudio === audio
                    ? 'bg-[#E50914] text-white'
                    : 'text-[#737373] dark:text-zinc-400'
                }`}
              >
                {audio}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#EEEEEE] dark:border-zinc-800">
          <div>
            <p className="text-sm font-semibold">Auto-advance Next Episode Prompt</p>
            <p className="text-xs text-[#737373] dark:text-zinc-400">
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
      </section>

      {/* Privacy & History */}
      <section className="p-6 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-5">
        <h2 className="font-display text-lg font-bold">Privacy & History</h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Save Search History</p>
            <p className="text-xs text-[#737373] dark:text-zinc-400">
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

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#EEEEEE] dark:border-zinc-800">
          <div>
            <p className="text-sm font-semibold">Save Watch History</p>
            <p className="text-xs text-[#737373] dark:text-zinc-400">
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

        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#EEEEEE] dark:border-zinc-800">
          <button
            type="button"
            disabled={searchHistory.length === 0}
            onClick={clearSearchHistory}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:border-[#E50914] disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Search History ({searchHistory.length})
          </button>

          <button
            type="button"
            disabled={history.length === 0}
            onClick={() => void clearHistory()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:border-[#E50914] disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Watch History ({history.length})
          </button>
        </div>
      </section>

      {/* Integration Status */}
      <section className="p-6 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-3">
        <h2 className="font-display text-lg font-bold">Provider Integration Status</h2>
        <dl className="text-sm space-y-2 text-[#737373] dark:text-zinc-400">
          <div className="flex justify-between gap-4">
            <dt>TMDB Server Read Access Token</dt>
            <dd className="font-semibold text-[#171717] dark:text-zinc-100">
              {statusInfo
                ? statusInfo.tmdbConfigured
                  ? 'Configured (Server-side)'
                  : 'Not Configured (Local Development Catalog active)'
                : 'Checking...'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Anime Metadata Adapter</dt>
            <dd className="font-semibold text-[#171717] dark:text-zinc-100">
              MyAnimeList / Jikan v4 (Separate MAL IDs)
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Streaming Embed Adapter</dt>
            <dd className="font-semibold text-[#171717] dark:text-zinc-100">VidLink Pro</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
