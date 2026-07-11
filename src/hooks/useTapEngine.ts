import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { haptic } from '@/lib/telegram';
import type { GameConfig, Particle } from '@/models/types';

const LEVEL_THRESHOLDS = [0, 50_000, 100_000]; // taps required per level

function calcLevel(totalTaps: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalTaps >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

interface UseTapEngineProps {
  telegramId:      string;
  initialBalance:  number;
  initialEnergy:   number;
  initialTotalTaps:number;
  hasAutoTap:      boolean;
  hasDoubleTap:    boolean;
  config:          GameConfig;
  onParticleSpawn: (p: Particle) => void;
  onLevelUp?:      (newLevel: number) => void;
}
interface UseTapEngineReturn {
  balance:    number; energy: number; isSyncing: boolean;
  tapCount:   number; totalTaps: number; level: number;
  levelProgress: number; // 0-1 within current level
  handleTap:  (x: number, y: number) => void;
}

export function useTapEngine({
  telegramId, initialBalance, initialEnergy, initialTotalTaps,
  hasAutoTap, hasDoubleTap, config, onParticleSpawn, onLevelUp,
}: UseTapEngineProps): UseTapEngineReturn {
  const coinsPerTap   = hasDoubleTap ? 2 : config.coinsPerTap;

  const [balance,    setBalance]    = useState(initialBalance);
  const [energy,     setEnergy]     = useState(initialEnergy);
  const [isSyncing,  setIsSyncing]  = useState(false);
  const [tapCount,   setTapCount]   = useState(0);
  const [totalTaps,  setTotalTaps]  = useState(initialTotalTaps);
  const [level,      setLevel]      = useState(() => calcLevel(initialTotalTaps));

  const localBalance  = useRef(initialBalance);
  const localEnergy   = useRef(initialEnergy);
  const localTotal    = useRef(initialTotalTaps);
  const syncTimer     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const energyTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTapTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync initial values when profile loads
  useEffect(() => {
    localBalance.current = initialBalance;
    localEnergy.current  = initialEnergy;
    localTotal.current   = initialTotalTaps;
    setBalance(initialBalance);
    setEnergy(initialEnergy);
    setTotalTaps(initialTotalTaps);
    setLevel(calcLevel(initialTotalTaps));
  }, [initialBalance, initialEnergy, initialTotalTaps]);

  // Energy regen
  useEffect(() => {
    energyTimer.current = setInterval(() => {
      localEnergy.current = Math.min(config.maxEnergy, localEnergy.current + config.regenRate);
      setEnergy(Math.floor(localEnergy.current));
    }, 1000);
    return () => { if (energyTimer.current) clearInterval(energyTimer.current); };
  }, [config.maxEnergy, config.regenRate]);

  const doTap = useCallback((x: number, y: number, isAuto = false) => {
    if (localEnergy.current < config.energyPerTap) return;
    if (!isAuto) haptic.tap();
    localEnergy.current  -= config.energyPerTap;
    localBalance.current += coinsPerTap;
    localTotal.current   += 1;

    setBalance(Math.round(localBalance.current));
    setEnergy(Math.floor(localEnergy.current));
    setTapCount(c => c + 1);
    setTotalTaps(t => {
      const next = t + 1;
      const newLevel = calcLevel(next);
      setLevel(prev => {
        if (newLevel > prev) { onLevelUp?.(newLevel); haptic.success(); }
        return newLevel;
      });
      return next;
    });

    if (!isAuto) {
      onParticleSpawn({
        id: `p-${Date.now()}-${Math.random()}`, x, y,
        vx: (Math.random() - 0.5) * 60, vy: -(40 + Math.random() * 40),
        value: coinsPerTap, opacity: 1, rotation: (Math.random() - 0.5) * 30,
        scale: 0.9 + Math.random() * 0.4, createdAt: Date.now(), type: 'text',
      });
    }
  }, [coinsPerTap, config.energyPerTap, onParticleSpawn, onLevelUp]);

  // Auto tap bot — fires every 1 second when enabled and energy available
  useEffect(() => {
    if (!hasAutoTap) return;
    autoTapTimer.current = setInterval(() => {
      if (localEnergy.current >= config.energyPerTap) doTap(0, 0, true);
    }, 1000);
    return () => { if (autoTapTimer.current) clearInterval(autoTapTimer.current); };
  }, [hasAutoTap, doTap, config.energyPerTap]);

  // Sync to Firestore every 3s
  const syncToFirestore = useCallback(async () => {
    if (!telegramId || telegramId === 'guest') return;
    try {
      setIsSyncing(true);
      const newLevel = calcLevel(localTotal.current);
      await updateDoc(doc(db, 'users', telegramId), {
        balance:          localBalance.current,
        totalEarned:      localBalance.current,
        energyAtLastSync: Math.floor(localEnergy.current),
        lastSyncAt:       Date.now(),
        totalTaps:        localTotal.current,
        tapLevel:         newLevel,
      });
    } catch { /* silent */ } finally { setIsSyncing(false); }
  }, [telegramId]);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(syncToFirestore, 3000);
  }, [syncToFirestore]);

  const handleTap = useCallback((x: number, y: number) => {
    doTap(x, y, false);
    scheduleSync();
  }, [doTap, scheduleSync]);

  // Visibility guard
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') syncToFirestore(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [syncToFirestore]);

  useEffect(() => () => { syncToFirestore(); }, [syncToFirestore]);

  // Level progress within current tier
  const tierStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const tierEnd   = LEVEL_THRESHOLDS[level]     ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
  const levelProgress = Math.min(1, (totalTaps - tierStart) / (tierEnd - tierStart));

  return { balance, energy, isSyncing, tapCount, totalTaps, level, levelProgress, handleTap };
}
