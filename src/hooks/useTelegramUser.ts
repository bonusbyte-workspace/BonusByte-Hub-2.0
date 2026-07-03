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

// Firestore does NOT accept undefined — strip all undefined fields
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
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
        const initData = getInitData();
        const sp       = initData.split('&').find(p => p.startsWith('start_param='));
        const refId    = sp ? sp.replace('start_param=', '') : undefined;

        const raw = {
          telegramId:       uid,
          username:         u.username   ?? '',
          firstName:        u.first_name ?? 'Player',
          lastName:         u.last_name,
          photoUrl:         u.photo_url,
          referrerId:       refId,
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
          serverTimestamp:  serverTimestamp(),
        };

        const safe = stripUndefined(raw as Record<string, unknown>);
        await setDoc(ref, safe);
        setUserProfile(safe as unknown as UserProfile);
      }
      setIsGuestMode(false);
      setGuestReason(null);
    } catch (err: unknown) {
      const code   = (err as { code?: string }).code ?? 'unknown';
      const msg    = err instanceof Error ? err.message : String(err);
      const reason = code + ': ' + msg.slice(0, 120);
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
