import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry, LeaderboardFilter } from '@/models/types';

interface UseLeaderboardReturn {
  entries:    LeaderboardEntry[];
  isLoading:  boolean;
  error:      string | null;
  filter:     LeaderboardFilter;
  setFilter:  (f: LeaderboardFilter) => void;
  updatedAt:  number | null;
  refetch:    () => void;
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

    fetch(`/api/leaderboard?filter=${filter}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setEntries(data.players ?? []);
        setUpdatedAt(data.updatedAt ?? null);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load leaderboard.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [filter, tick]);

  return { entries, isLoading, error, filter, setFilter, updatedAt, refetch };
}
