import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Referral {
  telegramId: string;
  username:   string;
  firstName:  string;
  joinedAt:   number;
  reward:     number;
}

interface UseReferralsReturn {
  referrals:    Referral[];
  total:        number;
  earnings:     number;
  isLoading:    boolean;
  referralLink: string;
  copyLink:     () => void;
  copied:       boolean;
}

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'BonusByteBot';
export const REFERRAL_REWARD = 500; // BB coins per referral

export function useReferrals(telegramId: string): UseReferralsReturn {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied,    setCopied]    = useState(false);

  useEffect(() => {
    if (!telegramId || telegramId === 'guest') { setIsLoading(false); return; }
    const q = query(
      collection(db, 'users', telegramId, 'referrals'),
      orderBy('joinedAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setReferrals(snap.docs.map(d => ({ telegramId: d.id, ...d.data() } as Referral)));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return unsub;
  }, [telegramId]);

  const referralLink = telegramId
    ? `https://t.me/${BOT_USERNAME}?start=${telegramId}`
    : '';

  const copyLink = useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard?.writeText(referralLink).catch(() => {});
    // Telegram share fallback
    if (window.Telegram?.WebApp) {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join BonusByte and start earning BB coins!')}`, '_blank');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const total    = referrals.length;
  const earnings = referrals.reduce((sum, r) => sum + (r.reward ?? 0), 0);

  return { referrals, total, earnings, isLoading, referralLink, copyLink, copied };
}
