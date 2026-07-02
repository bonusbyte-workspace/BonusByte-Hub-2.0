import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTelegramUser, getInitData } from '@/lib/telegram';
import type { TelegramUser, UserProfile } from '@/models/types';

interface UseTelegramUserReturn {
  telegramUser:  TelegramUser | null;
  userProfile:   UserProfile | null;
  isLoading:     boolean;
  error:         string | null;
  isGuestMode:   boolean;
  refetch:       () => Promise<void>;
}

function buildGuestProfile(tgUser: TelegramUser): UserProfile {
  return {
    telegramId:       String(tgUser.id),
    username:         tgUser.username   ?? '',
    firstName:        tgUser.first_name ?? 'Player',
    lastName:         tgUser.last_name,
    photoUrl:         tgUser.photo_url,
    balance:          0,
    totalEarned:      0,
    energyAtLastSync: 1000,
    lastSyncAt:       Date.now(),
    role:             'user',
    createdAt:        Date.now(),
    dailyEarned:      0,
    dailyResetAt:     Date.now(),
    tapLevel:         1,
    energyLevel:      1,
  };
}

export function useTelegramUser(): UseTelegramUserReturn {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isGuestMode,  setIsGuestMode]  = useState(false);

  const fetchOrCreateProfile = useCallback(async (tgUser: TelegramUser) => {
    const uid = String(tgUser.id);
    const ref = doc(db, 'users', uid);

    try {
      const snap = await getDoc(ref);
      const now  = Date.now();

      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
        setIsGuestMode(false);
      } else {
        const initData    = getInitData();
        const startParam  = initData.split('&').find(p => p.startsWith('start_param='));
        const referrerId  = startParam ? startParam.replace('start_param=', '') : undefined;

        const newProfile: UserProfile = {
          telegramId:       uid,
          username:         tgUser.username   ?? '',
          firstName:        tgUser.first_name ?? 'Player',
          lastName:         tgUser.last_name,
          photoUrl:         tgUser.photo_url,
          balance:          0,
          totalEarned:      0,
          energyAtLastSync: 1000,
          lastSyncAt:       now,
          role:             'user',
          createdAt:        now,
          referrerId,
          dailyEarned:      0,
          dailyResetAt:     now,
          tapLevel:         1,
          energyLevel:      1,
        };
        await setDoc(ref, { ...newProfile, serverTimestamp: serverTimestamp() });
        setUserProfile(newProfile);
        setIsGuestMode(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[BonusByte] Firestore unavailable, using guest mode:', msg);
      // Fall back to local guest profile — app fully works, state resets on refresh
      setUserProfile(buildGuestProfile(tgUser));
      setIsGuestMode(true);
    }
  }, []);

  const refetch = useCallback(async () => {
    const tgUser = getTelegramUser();
    if (!tgUser) return;
    setIsLoading(true);
    await fetchOrCreateProfile(tgUser);
    setIsLoading(false);
  }, [fetchOrCreateProfile]);

  useEffect(() => {
    const tgUser = getTelegramUser();

    // Dev mode fallback
    const devUser: TelegramUser = {
      id: 999999999, first_name: 'Dev', username: 'devuser', language_code: 'en',
    };
    const user = tgUser ?? (import.meta.env.DEV ? devUser : null);

    if (!user) {
      setError('Open BonusByte through Telegram.');
      setIsLoading(false);
      return;
    }

    setTelegramUser(user);
    fetchOrCreateProfile(user).finally(() => setIsLoading(false));
  }, [fetchOrCreateProfile]);

  return { telegramUser, userProfile, isLoading, error, isGuestMode, refetch };
}
