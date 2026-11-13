import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firestoreError';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (displayName: string, email: string, password: string) => Promise<boolean>;
  sendResetEmail: (email: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  refreshAuthSession: () => Promise<boolean>;
  updateUserProfileDetails: (displayName: string, photoURL: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method). Google Sign-In is ready to use immediately.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

async function ensureUserProfileDoc(currentUser: User) {
  if (!currentUser.emailVerified) return;
  const userPath = `users/${currentUser.uid}`;
  const ref = doc(db, 'users', currentUser.uid);

  try {
    const snap = await getDoc(ref);
    const displayName = (currentUser.displayName || currentUser.email?.split('@')[0] || 'Zyvo Member').slice(0, 100);
    const email = (currentUser.email || '').slice(0, 200);
    const photoURL = (currentUser.photoURL || '').slice(0, 500);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: currentUser.uid,
        displayName,
        email,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        ref,
        {
          displayName,
          email,
          photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setUserVersion] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      void (async () => {
        if (nextUser.emailVerified) {
          try {
            await nextUser.getIdToken(true);
          } catch {
            // proceed with cached token if network refresh fails
          }
        }
        setUser(nextUser);
        setAuthReady(true);
        if (nextUser.emailVerified) {
          void ensureUserProfileDoc(nextUser).catch((err) => {
            console.error('Failed to sync user profile document:', err);
          });
        }
      })();
    });
    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.emailVerified) {
        try {
          await cred.user.getIdToken(true);
        } catch {
          // ignore
        }
      }
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const registerWithEmail = async (displayName: string, email: string, password: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 100) });
      await sendEmailVerification(cred.user);
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const sendResetEmail = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const resendVerification = async () => {
    setAuthError(null);
    if (!auth.currentUser) return false;
    try {
      await sendEmailVerification(auth.currentUser);
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const refreshAuthSession = async () => {
    setAuthError(null);
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setUser(auth.currentUser);
      setUserVersion((v) => v + 1);
      if (auth.currentUser.emailVerified) {
        void ensureUserProfileDoc(auth.currentUser).catch((err) => {
          console.error('Failed to sync user profile document:', err);
        });
      }
      return auth.currentUser.emailVerified;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const updateUserProfileDetails = async (displayName: string, photoURL: string) => {
    setAuthError(null);
    if (!auth.currentUser) return false;
    try {
      const cleanName = displayName.trim().slice(0, 100);
      const cleanPhoto = photoURL.trim().slice(0, 500);
      await updateProfile(auth.currentUser, {
        displayName: cleanName,
        photoURL: cleanPhoto || null,
      });
      if (auth.currentUser.emailVerified) {
        const userPath = `users/${auth.currentUser.uid}`;
        try {
          await setDoc(
            doc(db, 'users', auth.currentUser.uid),
            {
              displayName: cleanName,
              email: (auth.currentUser.email || '').slice(0, 200),
              photoURL: cleanPhoto,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, userPath);
        }
      }
      setUser(auth.currentUser);
      setUserVersion((v) => v + 1);
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        authError,
        clearAuthError,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendResetEmail,
        resendVerification,
        refreshAuthSession,
        updateUserProfileDetails,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
