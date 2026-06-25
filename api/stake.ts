import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateInitData } from './_lib/adminAuth';
import { db } from './_lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const APY_MAP: Record<number, number> = { 7: 12, 30: 36, 90: 120 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { telegramId, initData, amount, lockDays } = req.body ?? {};

  // ── Validate initData ─────────────────────────────────────
  try {
    validateInitData(initData ?? '');
  } catch (e: unknown) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // ── Validate inputs ───────────────────────────────────────
  const amountNum  = Number(amount);
  const lockNum    = Number(lockDays);

  if (!telegramId || !amountNum || amountNum <= 0 || ![7, 30, 90].includes(lockNum)) {
    return res.status(400).json({ success: false, message: 'Invalid stake parameters' });
  }

  const apy = APY_MAP[lockNum];
  if (!apy) return res.status(400).json({ success: false, message: 'Invalid lock period' });

  const userRef = db.collection('users').doc(String(telegramId));

  try {
    const stakeResult = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) throw new Error('User not found');

      const data       = snap.data()!;
      const balance    = data.balance as number ?? 0;

      if (balance < amountNum) throw new Error('Insufficient balance');

      const now        = Date.now();
      const unlockAt   = now + lockNum * 24 * 60 * 60 * 1000;
      const projYield  = amountNum * (apy / 100) * (lockNum / 365);
      const newBalance = balance - amountNum;

      // Deduct balance
      t.update(userRef, {
        balance:   newBalance,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Create stake record
      const stakeRef = db.collection('users').doc(String(telegramId))
                         .collection('stakes').doc();
      t.set(stakeRef, {
        userId:         String(telegramId),
        amount:         amountNum,
        lockDays:       lockNum,
        apy,
        stakedAt:       now,
        unlockAt,
        status:         'active',
        projectedYield: projYield,
        createdAt:      FieldValue.serverTimestamp(),
      });

      return { stakeId: stakeRef.id, newBalance };
    });

    return res.status(200).json({ success: true, ...stakeResult });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Staking failed';
    return res.status(400).json({ success: false, message: msg });
  }
}
