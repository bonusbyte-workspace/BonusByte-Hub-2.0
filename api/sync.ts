import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateInitData } from './_lib/adminAuth.js';
import { db } from './_lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const MAX_CPS    = parseInt(process.env.VITE_MAX_CPS    ?? '20');
const MAX_ENERGY = parseInt(process.env.VITE_MAX_ENERGY  ?? '1000');
const REGEN_RATE = parseInt(process.env.VITE_REGEN_RATE  ?? '3');
const COINS_PER  = parseInt(process.env.VITE_COINS_PER_TAP ?? '1');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { telegramId, initData, clicks, deltaMs } = req.body ?? {};

  // ── 1. Validate initData HMAC ─────────────────────────────
  try {
    validateInitData(initData ?? '');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invalid initData';
    return res.status(401).json({ success: false, message: msg });
  }

  if (!telegramId || typeof clicks !== 'number' || typeof deltaMs !== 'number') {
    return res.status(400).json({ success: false, message: 'Bad payload' });
  }

  // ── 2. Anti-cheat: clicks ≤ MaxCPS × Δt ─────────────────
  const deltaSeconds = deltaMs / 1000;
  const maxAllowed   = Math.ceil(MAX_CPS * deltaSeconds);

  if (clicks > maxAllowed) {
    // Log the violation
    await db.collection('antiCheatLogs').add({
      telegramId,
      reason:         'CPS exceeded',
      clicksReported: clicks,
      maxAllowed,
      timestamp:      Date.now(),
    });
    return res.status(429).json({ success: false, message: 'Rate limit exceeded' });
  }

  // ── 3. Atomic Firestore transaction ──────────────────────
  const userRef = db.collection('users').doc(String(telegramId));

  try {
    const result = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) throw new Error('User not found');

      const data         = snap.data()!;
      const now          = Date.now();
      const lastSyncAt   = data.lastSyncAt as number ?? now;
      const elapsed      = (now - lastSyncAt) / 1000; // seconds

      // Server-authoritative energy calculation
      const energyAtLast = data.energyAtLastSync as number ?? MAX_ENERGY;
      const regenEnergy  = Math.min(MAX_ENERGY, energyAtLast + REGEN_RATE * elapsed);
      const energyCost   = clicks; // 1 energy per tap
      const newEnergy    = Math.max(0, regenEnergy - energyCost);

      // Only award coins for valid energy expenditure
      const validClicks  = Math.min(clicks, Math.floor(regenEnergy));
      const earned       = validClicks * COINS_PER;

      const newBalance   = (data.balance as number ?? 0) + earned;
      const newTotal     = (data.totalEarned as number ?? 0) + earned;

      // Daily tracking
      const todayReset   = new Date();
      todayReset.setHours(0, 0, 0, 0);
      const dailyResetAt = data.dailyResetAt as number ?? 0;
      const dailyEarned  = dailyResetAt < todayReset.getTime()
        ? earned
        : (data.dailyEarned as number ?? 0) + earned;

      t.update(userRef, {
        balance:          newBalance,
        totalEarned:      newTotal,
        dailyEarned,
        dailyResetAt:     todayReset.getTime(),
        energyAtLastSync: newEnergy,
        lastSyncAt:       now,
        updatedAt:        FieldValue.serverTimestamp(),
      });

      return { balance: newBalance, energy: newEnergy };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    console.error('[/api/sync]', msg);
    return res.status(500).json({ success: false, message: msg });
  }
}
