import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/firebase.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const filter = (req.query.filter as string) === 'daily' ? 'daily' : 'all-time';

  // ── Serve cached document ─────────────────────────────────
  const cacheRef  = db.collection('global').doc('leaderboard');
  const cacheSnap = await cacheRef.get();

  if (cacheSnap.exists) {
    const cached    = cacheSnap.data()!;
    const updatedAt = cached.updatedAt as number ?? 0;
    const age       = Date.now() - updatedAt;

    if (age < CACHE_TTL_MS) {
      const players = filter === 'daily'
        ? (cached.daily  as object[]) ?? []
        : (cached.allTime as object[]) ?? [];

      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).json({ players, updatedAt });
    }
  }

  // ── Cache stale — rebuild top 100 ─────────────────────────
  const [allTimeSnap, dailySnap] = await Promise.all([
    db.collection('users')
      .orderBy('totalEarned', 'desc')
      .limit(100)
      .get(),
    db.collection('users')
      .orderBy('dailyEarned', 'desc')
      .limit(100)
      .get(),
  ]);

  const toEntry = (snap: FirebaseFirestore.QueryDocumentSnapshot, rank: number, _field: 'totalEarned' | 'dailyEarned') => {
    const d = snap.data();
    return {
      rank,
      telegramId:  snap.id,
      username:    d.username    ?? '',
      firstName:   d.firstName   ?? 'Player',
      photoUrl:    d.photoUrl,
      totalEarned: d.totalEarned ?? 0,
      dailyEarned: d.dailyEarned ?? 0,
    };
  };

  const allTime = allTimeSnap.docs.map((doc, i) => toEntry(doc, i + 1, 'totalEarned'));
  const daily   = dailySnap.docs.map((doc, i)   => toEntry(doc, i + 1, 'dailyEarned'));

  const now = Date.now();

  // Write updated cache
  await cacheRef.set({ allTime, daily, updatedAt: now });

  const players = filter === 'daily' ? daily : allTime;

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({ players, updatedAt: now });
}
