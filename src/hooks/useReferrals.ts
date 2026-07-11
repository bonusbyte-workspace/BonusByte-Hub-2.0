import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Referral {
  telegramId: string; username: string; firstName: string; joinedAt: number; reward: number;
}
interface UseReferralsReturn {
  referrals: Referral[]; total: number; earnings: number;
  isLoading: boolean; referralLink: string; copyLink: () => void; copied: boolean;
}

const BOT_USERNAME = (import.meta as { env: Record<string,string> }).env.VITE_BOT_USERNAME || 'BonusByteBot';
export const REFERRAL_REWARD = 500;

export function useReferrals(telegramId: string): UseReferralsReturn {
  const [referrals,       setReferrals]       = useState<Referral[]>([]);
  const [profileTotal,    setProfileTotal]    = useState(0);
  const [profileEarnings, setProfileEarnings] = useState(0);
  const [isLoading,       setIsLoading]       = useState(true);
  const [copied,          setCopied]          = useState(false);

  useEffect(() => {
    if (!telegramId || telegramId === 'guest') { setIsLoading(false); return; }
    const unsub = onSnapshot(
      query(collection(db, 'users', telegramId, 'referrals'), orderBy('joinedAt', 'desc')),
      snap => { setReferrals(snap.docs.map(d => ({ telegramId: d.id, ...d.data() } as Referral))); setIsLoading(false); },
      () => setIsLoading(false)
    );
    return unsub;
  }, [telegramId]);

  useEffect(() => {
    if (!telegramId || telegramId === 'guest') return;
    return onSnapshot(doc(db, 'users', telegramId), snap => {
      if (snap.exists()) {
        setProfileTotal(snap.data().referralCount ?? 0);
        setProfileEarnings(snap.data().referralEarnings ?? 0);
      }
    });
  }, [telegramId]);

  const referralLink = telegramId && telegramId !== 'guest'
    ? `https://t.me/${BOT_USERNAME}?start=${telegramId}` : '';

  const copyLink = useCallback(() => {
    if (!referralLink) return;
    try { navigator.clipboard?.writeText(referralLink); } catch { /* ok */ }
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join BonusByte and earn free BB coins!')}`, '_blank');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const total    = referrals.length > 0 ? referrals.length : profileTotal;
  const earnings = referrals.length > 0 ? referrals.reduce((s, r) => s + (r.reward ?? 0), 0) : profileEarnings;

  return { referrals, total, earnings, isLoading, referralLink, copyLink, copied };
}
