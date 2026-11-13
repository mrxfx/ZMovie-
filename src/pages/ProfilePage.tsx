import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogOut, MailWarning, Settings, ShieldCheck, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminCatalog } from '../context/AdminCatalogContext';
import { useLibrary } from '../context/LibraryContext';
import { GlassButton, GlassPanel } from '../components/glass';
import { EmptyState } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

export function ProfilePage() {
  useSeoMetadata({
    title: 'Profile – ZyvoMovie',
    description: 'Manage your ZyvoMovie account profile, display name, and synced library.',
    path: '/profile',
  });

  const {
    user,
    authReady,
    authError,
    updateUserProfileDetails,
    resendVerification,
    logout,
  } = useAuth();
  const { watchlist, watchProgress, history } = useLibrary();
  const { isAdminUser } = useAdminCatalog();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || '');
  }, [user]);

  if (!authReady) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <div className="h-48 rounded-3xl glass-surface animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <EmptyState
          title="You are browsing as a guest"
          description="Your My List and Continue Watching are saved locally on this device. Sign in to sync your profile and library to Firebase."
          actionLabel="Sign In"
          actionTo="/login"
        />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    const ok = await updateUserProfileDetails(displayName, photoURL);
    setSaving(false);
    if (ok) setSavedMsg('Profile updated.');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="w-full pt-2 space-y-6">
      <GlassPanel variant="default" padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile avatar'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/80 dark:ring-white/20 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl glass-control flex items-center justify-center">
                <User className="w-7 h-7 text-[#E50914]" />
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                {user.displayName || 'ZyvoMovie Member'}
              </h1>
              <p className="text-sm text-white/70">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdminUser && (
              <GlassButton variant="glass" size="sm" to="/admin" className="text-[#E50914] border-[#E50914]/40">
                <ShieldCheck className="w-4 h-4" />
                Admin Studio
              </GlassButton>
            )}
            <GlassButton variant="glass" size="sm" to="/settings">
              <Settings className="w-4 h-4" />
              Settings
            </GlassButton>
            <GlassButton variant="primary" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </GlassButton>
          </div>
        </div>
      </GlassPanel>

      {!user.emailVerified && (
        <GlassPanel
          variant="subtle"
          padding="sm"
          className="border-amber-400/40 bg-amber-500/15 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-200"
        >
          <div className="flex items-center gap-2.5">
            <MailWarning className="w-5 h-5 shrink-0" />
            <span>Verify your email address to enable cloud Firestore synchronization.</span>
          </div>
          <button
            type="button"
            onClick={() => void resendVerification()}
            className="px-3.5 py-1.5 rounded-full bg-amber-500 text-black text-xs font-semibold cursor-pointer"
          >
            Resend Verification Email
          </button>
        </GlassPanel>
      )}

      {/* Account Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/my-list"
          className="glass-surface glass-specular rounded-2xl p-5 hover:border-white/40 hover:-translate-y-0.5 transition-all"
        >
          <p className="text-xs text-white/65">Saved in My List</p>
          <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-1">{watchlist.length}</p>
        </Link>
        <Link
          to="/continue-watching"
          className="glass-surface glass-specular rounded-2xl p-5 hover:border-white/40 hover:-translate-y-0.5 transition-all"
        >
          <p className="text-xs text-white/65">Continue Watching</p>
          <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-1">
            {watchProgress.length}
          </p>
        </Link>
        <Link
          to="/history"
          className="glass-surface glass-specular rounded-2xl p-5 hover:border-white/40 hover:-translate-y-0.5 transition-all"
        >
          <p className="text-xs text-white/65">History Entries</p>
          <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-1">{history.length}</p>
        </Link>
      </div>

      {/* Edit Profile Form */}
      <GlassPanel variant="default" padding="lg" className="rounded-3xl">
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="font-display text-lg font-bold text-white">Profile Details</h2>

          {authError && <p className="text-xs text-[#E50914]">{authError}</p>}
          {savedMsg && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {savedMsg}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-display-name" className="block text-xs font-semibold text-white mb-1.5">
                Display Name
              </label>
              <input
                id="profile-display-name"
                type="text"
                required
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
              />
            </div>

            <div>
              <label htmlFor="profile-photo-url" className="block text-xs font-semibold text-white mb-1.5">
                Avatar Image URL (optional)
              </label>
              <input
                id="profile-photo-url"
                type="url"
                maxLength={500}
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
              />
            </div>
          </div>

          <GlassButton type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </GlassButton>
        </form>
      </GlassPanel>
    </div>
  );
}
