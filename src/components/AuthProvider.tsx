'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ShopUser, ShopRegistrationData } from '@/types/User';
import { UserService } from '@/lib/userService';

type AuthContextValue = {
  firebaseUser: FirebaseUser | null;
  shopUser: ShopUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  registerShop: (registrationData: ShopRegistrationData) => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [shopUser, setShopUser] = useState<ShopUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = useCallback(async () => {
    if (!firebaseUser) {
      setShopUser(null);
      return;
    }

    try {
      const userData = await UserService.updateUserOnLogin({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined
      });

      setShopUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setShopUser(null);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);

      if (!u) {
        setShopUser(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      refreshUserData().finally(() => setLoading(false));
    }
  }, [firebaseUser, refreshUserData]);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseUser,
    shopUser,
    loading,
    signInWithGoogle: async () => {
      if (!auth || !googleProvider) return;
      await signInWithPopup(auth, googleProvider);
    },
    signUpWithEmail: async (email, password) => {
      if (!auth) return;
      await createUserWithEmailAndPassword(auth, email, password);
    },
    signInWithEmail: async (email, password) => {
      if (!auth) return;
      await signInWithEmailAndPassword(auth, email, password);
    },
    signOutUser: async () => {
      if (!auth) return;
      await signOut(auth);
      setFirebaseUser(null);
      setShopUser(null);
    },
    registerShop: async (registrationData: ShopRegistrationData) => {
      if (!firebaseUser) throw new Error('Must be signed in to register a shop');

      // Check if user already has shop data
      const existingUser = await UserService.getUserByUid(firebaseUser.uid);

      if (existingUser?.companyName) {
        // Update existing registration
        await UserService.updateShopRegistration(firebaseUser.uid, registrationData);
      } else {
        // New registration
        await UserService.registerShop(
          firebaseUser.uid,
          firebaseUser.email!,
          registrationData
        );
      }

      // Refresh user data
      await refreshUserData();
    },
    refreshUserData,
  }), [firebaseUser, shopUser, loading, refreshUserData]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}



