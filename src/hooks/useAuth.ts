import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword, signOut,
  onAuthStateChanged, User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  const [error,      setError]     = useState<string | null>(null);

  const resolveAdmin = useCallback(async (user: User): Promise<string | null> => {
    try {
      const snap = await getDoc(doc(db, 'admins', user.uid));
      if (!snap.exists()) {
        return 'No admin record found. Create Firestore document: admins/' + user.uid + ' with role: developer';
      }
      const role = snap.data().role as UserRole;
      if (!ADMIN_ROLES.includes(role)) {
        return 'Invalid role "' + role + '". Must be: developer, support, or economy';
      }
      setAdminUser({ uid: user.uid, email: user.email ?? '', role });
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('Missing')) {
        return 'Firestore rules block admins read. Update rules to allow: match /admins/{uid} { allow read: if request.auth != null; }';
      }
      return 'Admin lookup failed: ' + msg.slice(0, 100);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const err = await resolveAdmin(user);
        if (err) { setError(err); setAdminUser(null); }
      } else {
        setAdminUser(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, [resolveAdmin]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const cred  = await signInWithEmailAndPassword(auth, email, password);
      const err   = await resolveAdmin(cred.user);
      if (err) {
        setError(err);
        setIsLoading(false);
        return false;
      }
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const clean = msg
        .replace('Firebase: ', '')
        .replace(/\(auth\/.*\)\.?/, '')
        .trim();
      setError(clean || 'Login failed. Check email and password.');
      setIsLoading(false);
      return false;
    }
  }, [resolveAdmin]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setAdminUser(null);
    setError(null);
  }, []);

  return { adminUser, isLoading, error, login, logout, isAuthorized: adminUser !== null };
}
