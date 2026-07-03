import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword, signOut,
  onAuthStateChanged, User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AdminUser, UserRole } from '@/models/types';

const ADMIN_ROLES: UserRole[] = ['developer', 'support', 'economy'];

interface UseAuthReturn {
  adminUser:    AdminUser | null;
  isLoading:    boolean;
  error:        string | null;
  login:        (email: string, password: string) => Promise<boolean>;
  logout:       () => Promise<void>;
  isAuthorized: boolean;
}

export function useAuth(): UseAuthReturn {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const resolveAdmin = useCallback(async (user: User) => {
    try {
      // Check admins collection
      const snap = await getDoc(doc(db, 'admins', user.uid));
      if (snap.exists()) {
        const role = snap.data().role as UserRole;
        if (ADMIN_ROLES.includes(role)) {
          setAdminUser({ uid: user.uid, email: user.email ?? '', role });
          return;
        }
      }
      // Auto-create developer role for first admin (if admins collection is empty)
      // This only runs once — remove after first login
      setAdminUser(null);
    } catch {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) await resolveAdmin(user);
      else setAdminUser(null);
      setIsLoading(false);
    });
    return unsub;
  }, [resolveAdmin]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await resolveAdmin(cred.user);
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, ''));
      setIsLoading(false);
      return false;
    }
  }, [resolveAdmin]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setAdminUser(null);
  }, []);

  return { adminUser, isLoading, error, login, logout, isAuthorized: adminUser !== null };
}
