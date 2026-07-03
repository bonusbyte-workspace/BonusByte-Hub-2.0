import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTelegramUser, getInitData } from '@/lib/telegram';
import type { TelegramUser, UserProfile } from '@/models/types';

interface UseTelegramUserReturn {
  telegramUser: TelegramUser | null;
  userProfile:  UserProfile | null;
  isLoading:    boolean;
  error:        string | null;
  isGuestMode:  boolean;
  guestReason:  string | null;
  refetch:      () => Promise<void>;
}

function makeGuest(u: TelegramUser): UserProfile {
  const now = Date.now();
  return {
    telegramId: String(u.id), username: u.username ?? '',
    firstName: u.first_name ?? 'Player', balance: 0, totalEarned: 0,
    energyAtLastSync: 1000, lastSyncAt: now, role: 'user',
    createdAt: now, dailyEarned: 0, dailyResetAt: now,
    tapLevel: 1, energyLevel: 1,
  };
}

/** Remove undefined fields — Firestore rejects them */
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export function useTelegramUser(): UseTelegramUserReturn {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isGuestMode,  setIsGuestMode]  = useState(false);
  const [guestReason,  setGuestReason]  = useState<string | null>(null);

  const fetchOrCreate = useCallback(async (u: TelegramUser) => {
    const uid = String(u.id);
    const ref = doc(db, 'users', uid);
    try {
      const snap = await getDoc(ref);
      const now  = Date.now();
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        const initData  = getInitData();
        const sp        = initData.split('&').find(p => p.startsWith('start_param='));
        const refId     = sp ? sp.replace('start_param=', '') : undefined;

        const profile: UserProfile = {
          telegramId:       uid,
          username:         u.username   ?? '',
          firstName:        u.first_name ?? 'Player',
          ...(u.last_name  ? { lastName:  u.last_name  } : {}),
          ...(u.photo_url  ? { photoUrl:  u.photo_url  } : {}),
          ...(refId        ? { referrerId: refId        } : {}),
          balance:          0,
          totalEarned:      0,
          energyAtLastSync: 1000,
          lastSyncAt:       now,
          role:             'user',
          createdAt:        now,
          dailyEarned:      0,
          dailyResetAt:     now,
          tapLevel:         1,
          energyLevel:      1,
        };

        // clean() strips any remaining undefined before writing
        await setDoc(ref, { ...clean(profile), serverTimestamp: serverTimestamp() });
        setUserProfile(profile);
      }
      setIsGuestMode(false);
      setGuestReason(null);
    } catch (err: unknown) {
      const code   = (err as { code?: string }).code ?? 'unknown';
      const msg    = err instanceof Error ? err.message : String(err);
      const reason = code + ': ' + msg.slice(0, 80);
      console.error('[BB] Firestore:', reason);
      setUserProfile(makeGuest(u));
      setIsGuestMode(true);
      setGuestReason(reason);
    }
  }, []);

  const refetch = useCallback(async () => {
    const u = getTelegramUser();
    if (!u) return;
    setIsLoading(true);
    await fetchOrCreate(u);
    setIsLoading(false);
  }, [fetchOrCreate]);

  useEffect(() => {
    const u = getTelegramUser() ?? (import.meta.env.DEV
      ? { id: 999999999, first_name: 'Dev', username: 'devuser', language_code: 'en' } as TelegramUser
      : null);
    if (!u) { setError('Open via Telegram.'); setIsLoading(false); return; }
    setTelegramUser(u);
    fetchOrCreate(u).finally(() => setIsLoading(false));
  }, [fetchOrCreate]);

  return { telegramUser, userProfile, isLoading, error, isGuestMode, guestReason, refetch };
}
