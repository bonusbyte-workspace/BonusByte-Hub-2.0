import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AdminUser, UserRole } from '@/models/types';

const ADMIN_ROLES: UserRole[] = ['developer', 'support', 'economy'];

interface UseAuthReturn {
  adminUser:   AdminUser | null;
  isLoading:   boolean;
  error:       string | null;
  login:       (email: string, password: string) => Promise<boolean>;
  logout:      () => Promise<void>;
  isAuthorized: boolean;
}

export function useAuth(): UseAuthReturn {
  const [adminUser,  setAdminUser]  = useState<AdminUser | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const resolveAdminUser = useCallback(async (user: User): Promise<void> => {
    // Look up the user's role from their Firestore admin document
    try {
      const snap = await getDoc(doc(db, 'admins', user.uid));
      if (!snap.exists()) {
        setAdminUser(null);
        return;
      }
      const data = snap.data();
      const role = data.role as UserRole;
      if (!ADMIN_ROLES.includes(role)) {
        setAdminUser(null);
        return;
      }
      setAdminUser({ uid: user.uid, email: user.email ?? '', role });
    } catch {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await resolveAdminUser(user);
      } else {
        setAdminUser(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, [resolveAdminUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await resolveAdminUser(cred.user);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, ''));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [resolveAdminUser]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setAdminUser(null);
  }, []);

  return {
    adminUser,
    isLoading,
    error,
    login,
    logout,
    isAuthorized: adminUser !== null,
  };
}
