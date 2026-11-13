import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogOut, MailWarning, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
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
        <div className="h-48 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 animate-pulse" />
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEEEEE] dark:border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile avatar'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-[#EEEEEE] dark:border-zinc-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#F7F7F8] dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 flex items-center justify-center">
              <User className="w-7 h-7 text-[#E50914]" />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              {user.displayName || 'ZyvoMovie Member'}
            </h1>
            <p className="text-sm text-[#737373] dark:text-zinc-400">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-[#F7F7F8] dark:bg-zinc-900 text-sm font-medium hover:border-[#E50914]"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#171717] dark:bg-zinc-800 text-white text-sm font-semibold hover:bg-[#E50914] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {!user.emailVerified && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <MailWarning className="w-5 h-5 shrink-0" />
            <span>
              Verify your email address to enable cloud Firestore synchronization.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void resendVerification()}
            className="px-3.5 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-semibold"
          >
            Resend Verification Email
          </button>
        </div>
      )}

      {/* Account Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          to="/my-list"
          className="p-5 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 hover:border-[#E50914] transition-colors"
        >
          <p className="text-xs text-[#737373] dark:text-zinc-400">Saved in My List</p>
          <p className="font-display text-2xl font-bold font-mono-tabular mt-1">{watchlist.length}</p>
        </Link>
        <Link
          to="/continue-watching"
          className="p-5 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 hover:border-[#E50914] transition-colors"
        >
          <p className="text-xs text-[#737373] dark:text-zinc-400">Continue Watching</p>
          <p className="font-display text-2xl font-bold font-mono-tabular mt-1">
            {watchProgress.length}
          </p>
        </Link>
        <Link
          to="/history"
          className="p-5 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 hover:border-[#E50914] transition-colors"
        >
          <p className="text-xs text-[#737373] dark:text-zinc-400">History Entries</p>
          <p className="font-display text-2xl font-bold font-mono-tabular mt-1">{history.length}</p>
        </Link>
      </div>

      {/* Edit Profile Form */}
      <form
        onSubmit={handleSave}
        className="p-6 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-4"
      >
        <h2 className="font-display text-lg font-bold">Profile Details</h2>

        {authError && <p className="text-xs text-[#E50914]">{authError}</p>}
        {savedMsg && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {savedMsg}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-display-name" className="block text-xs font-semibold mb-1.5">
              Display Name
            </label>
            <input
              id="profile-display-name"
              type="text"
              required
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div>
            <label htmlFor="profile-photo-url" className="block text-xs font-semibold mb-1.5">
              Avatar Image URL (optional)
            </label>
            <input
              id="profile-photo-url"
              type="url"
              maxLength={500}
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm focus:outline-none focus:border-[#E50914]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
