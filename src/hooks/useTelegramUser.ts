import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTelegramUser, getStartParam } from '@/lib/telegram';
import type { TelegramUser, UserProfile } from '@/models/types';

const REFERRAL_REWARD = 500;

interface UseTelegramUserReturn {
  telegramUser: TelegramUser | null; userProfile: UserProfile | null;
  isLoading: boolean; error: string | null;
  isGuestMode: boolean; guestReason: string | null;
  refetch: () => Promise<void>;
}

function strip(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
function makeGuest(u: TelegramUser): UserProfile {
  const now = Date.now();
  return { telegramId: String(u.id), username: u.username ?? '', firstName: u.first_name ?? 'Player',
    balance: 0, totalEarned: 0, energyAtLastSync: 1000, lastSyncAt: now, role: 'user',
    createdAt: now, dailyEarned: 0, dailyResetAt: now, tapLevel: 1, energyLevel: 1 };
}

async function rewardReferrer(referrerId: string, newUserId: string, newUser: TelegramUser) {
  if (!referrerId || referrerId === newUserId) return;
  try {
    const ref  = doc(db, 'users', referrerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const d = snap.data();
    await setDoc(ref, {
      balance:          (d.balance          ?? 0) + REFERRAL_REWARD,
      totalEarned:      (d.totalEarned      ?? 0) + REFERRAL_REWARD,
      referralCount:    (d.referralCount    ?? 0) + 1,
      referralEarnings: (d.referralEarnings ?? 0) + REFERRAL_REWARD,
    }, { merge: true });
    await setDoc(doc(db, 'users', referrerId, 'referrals', newUserId), {
      telegramId: newUserId, username: newUser.username ?? '',
      firstName: newUser.first_name ?? 'Player',
      joinedAt: Date.now(), reward: REFERRAL_REWARD, status: 'rewarded',
    });
    console.log('[BB] Referral rewarded:', referrerId, '<--', newUserId);
  } catch (e) { console.warn('[BB] Referral failed:', e); }
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
        const refId = getStartParam();
        const safe  = strip({
          telegramId: uid, username: u.username ?? '', firstName: u.first_name ?? 'Player',
          lastName: u.last_name, photoUrl: u.photo_url, referrerId: refId,
          balance: 0, totalEarned: 0, energyAtLastSync: 1000, lastSyncAt: now,
          role: 'user', createdAt: now, dailyEarned: 0, dailyResetAt: now,
          tapLevel: 1, energyLevel: 1, referralCount: 0, referralEarnings: 0,
          totalTaps: 0, hasAutoTap: false, hasDoubleTap: false,
          serverTimestamp: serverTimestamp(),
        } as Record<string, unknown>);
        await setDoc(ref, safe);
        setUserProfile(safe as unknown as UserProfile);
        if (refId) await rewardReferrer(refId, uid, u);
      }
      setIsGuestMode(false); setGuestReason(null);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? 'unknown';
      const msg  = err instanceof Error ? err.message : String(err);
      setUserProfile(makeGuest(u)); setIsGuestMode(true); setGuestReason(code + ': ' + msg.slice(0, 120));
    }
  }, []);

  const refetch = useCallback(async () => {
    const u = getTelegramUser(); if (!u) return;
    setIsLoading(true); await fetchOrCreate(u); setIsLoading(false);
  }, [fetchOrCreate]);

  useEffect(() => {
    const u = getTelegramUser() ?? (import.meta.env.DEV
      ? { id: 999999999, first_name: 'Dev', username: 'devuser', language_code: 'en' } as TelegramUser : null);
    if (!u) { setError('Open via Telegram.'); setIsLoading(false); return; }
    setTelegramUser(u); fetchOrCreate(u).finally(() => setIsLoading(false));
  }, [fetchOrCreate]);

  return { telegramUser, userProfile, isLoading, error, isGuestMode, guestReason, refetch };
}
