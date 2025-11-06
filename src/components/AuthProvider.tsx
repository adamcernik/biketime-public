'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u && db) {
        const adminEmails = new Set(
          [
            ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS
              ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
              : []),
            'adam.cernik@gmail.com', // seed poweradmin
          ].filter(Boolean)
        );
        const shouldBeAdmin = adminEmails.has((u.email ?? '').toLowerCase());
        const ref = doc(db, 'users', u.uid);
        getDoc(ref).then(async (snap) => {
          if (!snap.exists()) {
            await setDoc(ref, {
              uid: u.uid,
              email: u.email ?? '',
              displayName: u.displayName ?? '',
              photoURL: u.photoURL ?? '',
              isAdmin: shouldBeAdmin,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
          } else {
            const current = snap.data() as { isAdmin?: boolean } | undefined;
            const updates: Record<string, unknown> = { lastLoginAt: serverTimestamp() };
            if (shouldBeAdmin && !current?.isAdmin) updates.isAdmin = true;
            await updateDoc(ref, updates);
          }
        }).catch(() => {/* ignore */});
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signInWithGoogle: async () => {
      if (!auth || !googleProvider) return;
      await signInWithPopup(auth, googleProvider);
    },
    signOutUser: async () => {
      if (!auth) return;
      await signOut(auth);
    },
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}



