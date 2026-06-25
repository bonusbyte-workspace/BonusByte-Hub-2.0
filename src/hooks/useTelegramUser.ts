import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTelegramUser, getInitData } from '@/lib/telegram';
import type { TelegramUser, UserProfile } from '@/models/types';

interface UseTelegramUserReturn {
  telegramUser: TelegramUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTelegramUser(): UseTelegramUserReturn {
  const [telegramUser, setTelegramUser]   = useState<TelegramUser | null>(null);
  const [userProfile,  setUserProfile]    = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]      = useState(true);
  const [error,        setError]          = useState<string | null>(null);

  const fetchOrCreateProfile = useCallback(async (tgUser: TelegramUser) => {
    const uid = String(tgUser.id);
    const ref = doc(db, 'users', uid);

    try {
      const snap = await getDoc(ref);
      const now  = Date.now();

      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // First-time user: create profile document
        const initData = getInitData();
        const referrerId = new URLSearchParams(
          initData.split('&').find(p => p.startsWith('start_param='))?.replace('start_param=', '') ?? ''
        ).get('ref') ?? undefined;

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
      }
    } catch (err) {
      console.error('[useTelegramUser] Firestore error:', err);
      setError('Failed to load profile. Please restart.');
    }
  }, []);

  const refetch = useCallback(async () => {
    const tgUser = getTelegramUser();
    if (!tgUser) return;
    await fetchOrCreateProfile(tgUser);
  }, [fetchOrCreateProfile]);

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (!tgUser) {
      // Running outside Telegram (dev mode) — use mock user
      if (import.meta.env.DEV) {
        const mockUser: TelegramUser = {
          id: 999999999,
          first_name: 'Dev',
          username: 'devuser',
          language_code: 'en',
        };
        setTelegramUser(mockUser);
        fetchOrCreateProfile(mockUser).finally(() => setIsLoading(false));
      } else {
        setError('Please open BonusByte through Telegram.');
        setIsLoading(false);
      }
      return;
    }

    setTelegramUser(tgUser);
    fetchOrCreateProfile(tgUser).finally(() => setIsLoading(false));
  }, [fetchOrCreateProfile]);

  return { telegramUser, userProfile, isLoading, error, refetch };
}
