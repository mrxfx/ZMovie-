import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Lock,
  LogOut,
  Play,
  Plus,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  type AdminCatalogInput,
  useAdminCatalog,
} from '../context/AdminCatalogContext';
import type { AdminCatalogItem, MediaType } from '../types/media';
import { compressImageFileToDataUrl } from '../utils/imageUpload';
import { extractShortSlug, getShortTypeCode } from '../utils/mediaRoutes';
import { GlassBadge, GlassButton, GlassModal, GlassPanel } from '../components/glass';
import { EmptyState, GridSkeleton } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 focus:border-white/45 transition-all';

interface FormState {
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseYear: string;
  voteAverage: string;
  runtime: string;
  originalLanguage: string;
  genresText: string;
  tmdbId: string;
  malId: string;
  seasonCount: string;
  episodeCount: string;
  featured: boolean;
}

const EMPTY_FORM: FormState = {
  mediaType: 'movie',
  title: '',
  overview: '',
  posterPath: '',
  backdropPath: '',
  releaseYear: String(new Date().getFullYear()),
  voteAverage: '0',
  runtime: '',
  originalLanguage: 'en',
  genresText: '',
  tmdbId: '',
  malId: '',
  seasonCount: '1',
  episodeCount: '12',
  featured: false,
};

export function AdminPage() {
  useSeoMetadata({
    title: 'Admin Publishing Studio – ZyvoMovie',
    description: 'Publish and manage movies, TV shows, anime, posters, and VidLink mappings in Firestore.',
    path: '/admin',
  });

  const {
    user,
    authReady,
    authError,
    signInWithGoogle,
    resendVerification,
    refreshAuthSession,
    logout,
  } = useAuth();
  const {
    adminItems,
    loadingAdminCatalog,
    isAdminUser,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
  } = useAdminCatalog();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<'poster' | 'backdrop' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaType>('all');
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<AdminCatalogItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const movies = adminItems.filter((i) => i.mediaType === 'movie').length;
    const tvAndAnime = adminItems.filter((i) => i.mediaType !== 'movie').length;
    const featured = adminItems.filter((i) => i.featured).length;
    return { total: adminItems.length, movies, tvAndAnime, featured };
  }, [adminItems]);

  const filteredItems = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return adminItems.filter((item) => {
      if (typeFilter !== 'all' && item.mediaType !== typeFilter) return false;
      if (q && !item.title.toLowerCase().includes(q) && !item.overview.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [adminItems, searchFilter, typeFilter]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'poster' | 'backdrop'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    setUploadingField(target);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, {
        maxWidth: target === 'poster' ? 720 : 1280,
        maxDataUrlLength: 340_000,
      });
      setForm((prev) =>
        target === 'poster' ? { ...prev, posterPath: dataUrl } : { ...prev, backdropPath: dataUrl }
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to process image upload.');
    } finally {
      setUploadingField(null);
    }
  };

  const startEdit = (item: AdminCatalogItem) => {
    setEditingId(item.itemId);
    setFormError(null);
    setStatusMessage(null);
    setForm({
      mediaType: item.mediaType,
      title: item.title,
      overview: item.overview,
      posterPath: item.posterPath || '',
      backdropPath: item.backdropPath || '',
      releaseYear: item.releaseYear || String(new Date().getFullYear()),
      voteAverage: String(item.voteAverage ?? 8.0),
      runtime: item.runtime ? String(item.runtime) : '',
      originalLanguage: item.originalLanguage || 'en',
      genresText: item.genres.join(', '),
      tmdbId: item.tmdbId ? String(item.tmdbId) : '',
      malId: item.malId ? String(item.malId) : '',
      seasonCount: item.seasonCount ? String(item.seasonCount) : '1',
      episodeCount: item.episodeCount ? String(item.episodeCount) : '12',
      featured: item.featured,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    const title = form.title.trim();
    const overview = form.overview.trim();
    const releaseYear = form.releaseYear.trim();
    const rating = Number(form.voteAverage);

    if (!title) {
      setFormError('Title is required.');
      return;
    }
    if (!overview) {
      setFormError('Synopsis / overview is required.');
      return;
    }
    if (!releaseYear || releaseYear.length > 10) {
      setFormError('Release year must be 1–10 characters (for example, 2025).');
      return;
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      setFormError('Rating must be a number between 0 and 10.');
      return;
    }

    const parsedTmdbId = form.tmdbId.trim() ? Number(form.tmdbId.trim()) : undefined;
    if (
      parsedTmdbId !== undefined &&
      (!Number.isInteger(parsedTmdbId) || parsedTmdbId <= 0)
    ) {
      setFormError('TMDB ID must be a positive whole number.');
      return;
    }

    const parsedMalId = form.malId.trim() ? Number(form.malId.trim()) : undefined;
    if (parsedMalId !== undefined && (!Number.isInteger(parsedMalId) || parsedMalId <= 0)) {
      setFormError('MyAnimeList (MAL) ID must be a positive whole number.');
      return;
    }

    const parsedRuntime = form.runtime.trim() ? Number(form.runtime.trim()) : undefined;
    const parsedSeasons =
      form.mediaType === 'tv' && form.seasonCount.trim()
        ? Math.max(1, Math.floor(Number(form.seasonCount.trim()) || 1))
        : undefined;
    const parsedEpisodes =
      (form.mediaType === 'tv' || form.mediaType === 'anime') && form.episodeCount.trim()
        ? Math.max(1, Math.floor(Number(form.episodeCount.trim()) || 1))
        : undefined;

    const genres = form.genresText
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 10);

    const payload: AdminCatalogInput = {
      mediaType: form.mediaType,
      title,
      overview,
      posterPath: form.posterPath.trim(),
      backdropPath: form.backdropPath.trim(),
      releaseYear,
      voteAverage: rating,
      runtime: parsedRuntime && Number.isFinite(parsedRuntime) && parsedRuntime > 0 ? parsedRuntime : undefined,
      originalLanguage: form.originalLanguage.trim() || 'en',
      genres,
      tmdbId: form.mediaType === 'anime' ? undefined : parsedTmdbId,
      malId: form.mediaType === 'anime' ? parsedMalId : undefined,
      seasonCount: parsedSeasons,
      episodeCount: parsedEpisodes,
      featured: form.featured,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateCatalogItem(editingId, payload);
        setStatusMessage(`Updated "${title}" in the live catalog.`);
        setEditingId(null);
      } else {
        await createCatalogItem(payload);
        setStatusMessage(`Published "${title}" to the live catalog.`);
      }
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Failed to save catalog item to Firestore. Check admin permissions.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: AdminCatalogItem) => {
    setDeletingId(item.itemId);
    setFormError(null);
    setStatusMessage(null);
    try {
      await deleteCatalogItem(item.itemId);
      setConfirmDeleteItem(null);
      if (editingId === item.itemId) {
        resetForm();
      }
      setStatusMessage(`Removed "${item.title}" from the catalog.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to delete title.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!authReady) {
    return (
      <div className="w-full pt-4">
        <GridSkeleton count={6} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-12">
        <GlassPanel variant="elevated" padding="lg" className="rounded-3xl space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl glass-control mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#E50914]" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Admin Publishing Studio
            </h1>
            <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
              Sign in with a verified administrator account ({BOOTSTRAPPED_ADMIN_EMAIL}) to publish
              movies, TV shows, anime, artwork, and VidLink stream mappings.
            </p>
          </div>
          {authError && <p className="text-xs text-[#E50914]">{authError}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <GlassButton variant="primary" size="md" onClick={() => void signInWithGoogle()}>
              Sign in with Google
            </GlassButton>
            <GlassButton variant="glass" size="md" to="/login">
              Email Sign In
            </GlassButton>
            <GlassButton variant="ghost" size="md" to="/">
              Return Home
            </GlassButton>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-12">
        <GlassPanel variant="elevated" padding="lg" className="rounded-3xl space-y-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-[#E50914] shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
                Administrator Access Required
              </h1>
              <p className="text-sm text-white/70 leading-relaxed">
                Signed in as{' '}
                <strong className="text-white">
                  {user.email || user.uid}
                </strong>{' '}
                ({user.emailVerified ? 'email verified' : 'email unverified'}). Firestore security
                rules only permit verified administrators ({BOOTSTRAPPED_ADMIN_EMAIL}) to create,
                edit, or delete published catalog entries.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!user.emailVerified && (
              <>
                <GlassButton variant="primary" size="md" onClick={() => void refreshAuthSession()}>
                  Refresh Verification Status
                </GlassButton>
                <GlassButton variant="glass" size="md" onClick={() => void resendVerification()}>
                  Resend Verification Email
                </GlassButton>
              </>
            )}
            <GlassButton variant="glass" size="md" onClick={() => void logout()}>
              <LogOut className="w-4 h-4" />
              Switch Account
            </GlassButton>
            <GlassButton variant="ghost" size="md" to="/">
              Back to Home
            </GlassButton>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="w-full pt-2 space-y-6">
      {/* Glass Header */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl flex flex-wrap items-end justify-between gap-4">
        <div>
          <GlassBadge variant="red" size="xs" className="mb-2">
            ZyvoMovie Studio
          </GlassBadge>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Catalog Publishing Panel
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Signed in as {user.email} · Published titles appear immediately across Home, Browse,
            Search, and VidLink Player.
          </p>
        </div>

        <GlassButton variant="glass" size="md" to="/">
          View Live Storefront
          <ExternalLink className="w-4 h-4" />
        </GlassButton>
      </GlassPanel>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel variant="subtle" padding="md">
          <p className="text-xs text-white/65">Published Titles</p>
          <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-1">{stats.total}</p>
        </GlassPanel>
        <GlassPanel variant="subtle" padding="md">
          <p className="text-xs text-white/65">Movies</p>
          <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-1">{stats.movies}</p>
        </GlassPanel>
        <GlassPanel variant="subtle" padding="md">
          <p className="text-xs text-white/65">TV Shows &amp; Anime</p>
          <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-1">
            {stats.tvAndAnime}
          </p>
        </GlassPanel>
        <GlassPanel variant="subtle" padding="md">
          <p className="text-xs text-white/65">Hero Spotlights</p>
          <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-1">{stats.featured}</p>
        </GlassPanel>
      </div>

      {statusMessage && (
        <GlassPanel
          variant="subtle"
          padding="sm"
          className="border-emerald-400/40 bg-emerald-500/20 text-sm text-emerald-200 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </GlassPanel>
      )}

      {formError && (
        <GlassPanel
          role="alert"
          variant="subtle"
          padding="sm"
          className="border-[#E50914]/45 bg-[#E50914]/20 text-sm text-red-200"
        >
          {formError}
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Publish / Edit Glass Form */}
        <GlassPanel variant="default" padding="lg" className="lg:col-span-7 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
              <h2 className="font-display text-lg font-bold text-white">
                {editingId ? 'Edit Published Title' : 'Publish New Title'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-white/70 hover:text-[#E50914] cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Media Type */}
            <div>
              <span className="block text-xs font-semibold text-white mb-2">Content Type</span>
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
                {(['movie', 'tv', 'anime'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, mediaType: type }))}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      form.mediaType === type
                        ? 'bg-[#E50914] text-white shadow-sm'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {type === 'movie' ? 'Movie' : type === 'tv' ? 'TV Series' : 'Anime'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="admin-title" className="block text-xs font-semibold mb-1.5">
                  Title
                </label>
                <input
                  id="admin-title"
                  type="text"
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Furiosa: A Mad Max Saga"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="admin-year" className="block text-xs font-semibold mb-1.5">
                  Release Year
                </label>
                <input
                  id="admin-year"
                  type="text"
                  required
                  maxLength={10}
                  value={form.releaseYear}
                  onChange={(e) => setForm((p) => ({ ...p, releaseYear: e.target.value }))}
                  placeholder="2025"
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
            </div>

            {/* Rating, Runtime, Language */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="admin-rating" className="block text-xs font-semibold mb-1.5">
                  Rating (0 – 10)
                </label>
                <input
                  id="admin-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={form.voteAverage}
                  onChange={(e) => setForm((p) => ({ ...p, voteAverage: e.target.value }))}
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>

              <div>
                <label htmlFor="admin-runtime" className="block text-xs font-semibold mb-1.5">
                  Runtime (minutes)
                </label>
                <input
                  id="admin-runtime"
                  type="number"
                  min="1"
                  max="999"
                  value={form.runtime}
                  onChange={(e) => setForm((p) => ({ ...p, runtime: e.target.value }))}
                  placeholder="120"
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>

              <div>
                <label htmlFor="admin-language" className="block text-xs font-semibold mb-1.5">
                  Language Code
                </label>
                <select
                  id="admin-language"
                  value={form.originalLanguage}
                  onChange={(e) => setForm((p) => ({ ...p, originalLanguage: e.target.value }))}
                  className={INPUT_CLASS}
                >
                  <option value="en">English (en)</option>
                  <option value="ja">Japanese (ja)</option>
                  <option value="ko">Korean (ko)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>
            </div>

            {/* Genres */}
            <div>
              <label htmlFor="admin-genres" className="block text-xs font-semibold mb-1.5">
                Genres (comma-separated, up to 10)
              </label>
              <input
                id="admin-genres"
                type="text"
                value={form.genresText}
                onChange={(e) => setForm((p) => ({ ...p, genresText: e.target.value }))}
                placeholder="Science Fiction, Action, Thriller"
                className={INPUT_CLASS}
              />
            </div>

            {/* Overview */}
            <div>
              <label htmlFor="admin-overview" className="block text-xs font-semibold mb-1.5">
                Synopsis / Overview
              </label>
              <textarea
                id="admin-overview"
                required
                rows={3}
                maxLength={4000}
                value={form.overview}
                onChange={(e) => setForm((p) => ({ ...p, overview: e.target.value }))}
                placeholder="Describe the storyline, cast highlights, or premiere context..."
                className={INPUT_CLASS}
              />
            </div>

            {/* VidLink ID Mapping */}
            <div className="pt-3 border-t border-white/15 space-y-3">
              <h3 className="font-display text-sm font-bold">VidLink Stream ID Mapping</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {form.mediaType !== 'anime' ? (
                  <div>
                    <label htmlFor="admin-tmdb-id" className="block text-xs font-semibold mb-1.5">
                      TMDB ID (for VidLink)
                    </label>
                    <input
                      id="admin-tmdb-id"
                      type="number"
                      min="1"
                      value={form.tmdbId}
                      onChange={(e) => setForm((p) => ({ ...p, tmdbId: e.target.value }))}
                      placeholder={form.mediaType === 'movie' ? '786892' : '94997'}
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="admin-mal-id" className="block text-xs font-semibold mb-1.5">
                      MyAnimeList (MAL) ID
                    </label>
                    <input
                      id="admin-mal-id"
                      type="number"
                      min="1"
                      value={form.malId}
                      onChange={(e) => setForm((p) => ({ ...p, malId: e.target.value }))}
                      placeholder="40748"
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                )}

                {form.mediaType === 'tv' && (
                  <div>
                    <label htmlFor="admin-seasons" className="block text-xs font-semibold mb-1.5">
                      Seasons
                    </label>
                    <input
                      id="admin-seasons"
                      type="number"
                      min="1"
                      max="50"
                      value={form.seasonCount}
                      onChange={(e) => setForm((p) => ({ ...p, seasonCount: e.target.value }))}
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                )}

                {(form.mediaType === 'tv' || form.mediaType === 'anime') && (
                  <div>
                    <label htmlFor="admin-episodes" className="block text-xs font-semibold mb-1.5">
                      Episodes
                    </label>
                    <input
                      id="admin-episodes"
                      type="number"
                      min="1"
                      max="500"
                      value={form.episodeCount}
                      onChange={(e) => setForm((p) => ({ ...p, episodeCount: e.target.value }))}
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-white/65">
                {form.mediaType === 'anime'
                  ? 'VidLink Anime streams resolve via MyAnimeList ID (/anime/{MALid}/{ep}/{sub|dub}?fallback=true).'
                  : `VidLink ${form.mediaType === 'tv' ? 'Shows' : 'Movies'} resolve via TMDB ID.`}
              </p>
            </div>

            {/* Poster Artwork Upload or URL */}
            <div className="pt-3 border-t border-white/15 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="admin-poster-url" className="text-xs font-semibold">
                  Poster Artwork (HTTPS URL or Compressed File Upload)
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-control text-xs font-semibold cursor-pointer hover:border-[#E50914]">
                  <Upload className="w-3.5 h-3.5 text-[#E50914]" />
                  {uploadingField === 'poster' ? 'Compressing...' : 'Upload Poster'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleImageUpload(e, 'poster')}
                    className="sr-only"
                  />
                </label>
              </div>
              <input
                id="admin-poster-url"
                type="text"
                value={form.posterPath}
                onChange={(e) => setForm((p) => ({ ...p, posterPath: e.target.value }))}
                placeholder="https://image.tmdb.org/t/p/w500/... or upload an image file"
                className={INPUT_CLASS}
              />
            </div>

            {/* Backdrop Artwork Upload or URL */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="admin-backdrop-url" className="text-xs font-semibold">
                  Backdrop Banner (Optional)
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-control text-xs font-semibold cursor-pointer hover:border-[#E50914]">
                  <ImageIcon className="w-3.5 h-3.5 text-[#E50914]" />
                  {uploadingField === 'backdrop' ? 'Compressing...' : 'Upload Backdrop'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleImageUpload(e, 'backdrop')}
                    className="sr-only"
                  />
                </label>
              </div>
              <input
                id="admin-backdrop-url"
                type="text"
                value={form.backdropPath}
                onChange={(e) => setForm((p) => ({ ...p, backdropPath: e.target.value }))}
                placeholder="https://image.tmdb.org/t/p/w1280/... or upload an image file"
                className={INPUT_CLASS}
              />
            </div>

            {/* Featured Checkbox */}
            <label className="flex items-center gap-3 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                className="w-4 h-4 accent-[#E50914]"
              />
              <span className="text-sm font-medium">Feature on Home Hero Spotlight</span>
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting || uploadingField !== null}
              >
                <Plus className="w-4 h-4" />
                {submitting
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Publish to ZyvoMovie'}
              </GlassButton>
            </div>
          </form>
        </GlassPanel>

        {/* Live Card Preview & Published List */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel variant="default" padding="md" className="rounded-3xl space-y-4">
            <h2 className="font-display text-base font-bold">Live Card Preview</h2>
            <div className="flex gap-4 items-start">
              <div className="w-28 aspect-[2/3] rounded-2xl overflow-hidden glass-control shrink-0">
                {form.posterPath ? (
                  <img
                    src={form.posterPath}
                    alt={form.title || 'Poster preview'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <Film className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 min-w-0">
                <p className="font-display text-base font-bold text-white line-clamp-2">
                  {form.title || 'Untitled Release'}
                </p>
                <p className="text-xs text-white/65 font-mono-tabular">
                  {form.releaseYear || 'TBA'} · ★ {Number(form.voteAverage || 0).toFixed(1)} ·{' '}
                  {form.mediaType === 'tv'
                    ? 'TV Series'
                    : form.mediaType === 'anime'
                      ? 'Anime'
                      : 'Movie'}
                </p>
                <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                  {form.overview || 'Your synopsis preview appears here once entered.'}
                </p>
              </div>
            </div>
          </GlassPanel>

          {/* Published Items List */}
          <GlassPanel variant="default" padding="md" className="rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-white">
                Published Catalog ({adminItems.length})
              </h2>
              <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
                {(['all', 'movie', 'tv', 'anime'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                      typeFilter === t
                        ? 'bg-[#E50914] text-white'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-white/55 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter published titles..."
                aria-label="Filter published titles"
                className="w-full pl-9 pr-3.5 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
              />
            </div>

            {loadingAdminCatalog ? (
              <p className="text-sm text-white/65">Loading catalog items...</p>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                title="No published entries yet"
                description="Publish a movie, TV series, or anime using the form to make it live across ZyvoMovie."
              />
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="p-3.5 rounded-2xl glass-white flex gap-3 items-start"
                  >
                    <div className="w-12 aspect-[2/3] rounded-xl overflow-hidden bg-white/10 shrink-0">
                      {item.posterPath ? (
                        <img
                          src={item.posterPath}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">
                          <Film className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/${getShortTypeCode(item.mediaType)}/${extractShortSlug(item.mediaType, item.itemId, item.tmdbId, item.malId)}`}
                          className="font-display text-sm font-bold text-white hover:text-[#E50914] line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        {item.featured && (
                          <GlassBadge variant="red" size="xs">
                            Spotlight
                          </GlassBadge>
                        )}
                      </div>

                      <p className="text-xs text-white/65 font-mono-tabular">
                        {item.mediaType.toUpperCase()} · {item.releaseYear} ·{' '}
                        <Star className="w-3 h-3 inline text-[#E50914] fill-[#E50914] -mt-0.5" />{' '}
                        {item.voteAverage.toFixed(1)}
                        {item.tmdbId ? ` · TMDB #${item.tmdbId}` : ''}
                        {item.malId ? ` · MAL #${item.malId}` : ''}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Link
                          to={`/w/${getShortTypeCode(item.mediaType)}/${extractShortSlug(item.mediaType, item.itemId, item.tmdbId, item.malId)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E50914] hover:underline"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Watch
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white/75 hover:text-white cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteItem(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white/75 hover:text-[#E50914] ml-auto cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>

      {/* Liquid Glass Delete Confirmation Modal */}
      <GlassModal
        open={Boolean(confirmDeleteItem)}
        onClose={() => setConfirmDeleteItem(null)}
        title="Delete Published Title"
        subtitle="This removes the catalog document from Firestore immediately."
        maxWidthClass="max-w-md"
      >
        {confirmDeleteItem && (
          <div className="space-y-5">
            <p className="text-sm text-white/75 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-white">
                {confirmDeleteItem.title}
              </strong>
              ?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <GlassButton
                variant="glass"
                size="md"
                onClick={() => setConfirmDeleteItem(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                size="md"
                disabled={deletingId === confirmDeleteItem.itemId}
                onClick={() => void handleDelete(confirmDeleteItem)}
              >
                <Trash2 className="w-4 h-4" />
                {deletingId === confirmDeleteItem.itemId ? 'Deleting...' : 'Delete Title'}
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
