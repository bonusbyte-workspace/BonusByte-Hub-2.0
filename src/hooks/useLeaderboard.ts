import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LeaderboardEntry, LeaderboardFilter } from '@/models/types';

interface UseLeaderboardReturn {
  entries:   LeaderboardEntry[];
  isLoading: boolean;
  error:     string | null;
  filter:    LeaderboardFilter;
  setFilter: (f: LeaderboardFilter) => void;
  updatedAt: number | null;
  refetch:   () => void;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [entries,   setEntries]   = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [filter,    setFilter]    = useState<LeaderboardFilter>('all-time');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [tick,      setTick]      = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const field = filter === 'daily' ? 'dailyEarned' : 'totalEarned';

    const q = query(
      collection(db, 'users'),
      orderBy(field, 'desc'),
      limit(100)
    );

    getDocs(q)
      .then(snap => {
        if (cancelled) return;
        const list: LeaderboardEntry[] = snap.docs.map((doc, i) => {
          const d = doc.data();
          return {
            rank:        i + 1,
            telegramId:  doc.id,
            username:    d.username    ?? '',
            firstName:   d.firstName   ?? 'Player',
            photoUrl:    d.photoUrl,
            totalEarned: d.totalEarned ?? 0,
            dailyEarned: d.dailyEarned ?? 0,
          };
        });
        setEntries(list);
        setUpdatedAt(Date.now());
      })
      .catch(err => {
        if (!cancelled) setError('Could not load leaderboard: ' + err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [filter, tick]);

  return { entries, isLoading, error, filter, setFilter, updatedAt, refetch };
}
