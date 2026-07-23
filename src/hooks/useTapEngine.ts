import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { haptic } from '@/lib/telegram';
import type { GameConfig, Particle } from '@/models/types';

const LEVEL_THRESHOLDS = [0, 50_000, 100_000];
const LEVEL_NAMES      = ['Beginner', 'Advanced', 'Elite'];

export { LEVEL_THRESHOLDS, LEVEL_NAMES };

export function calcLevel(totalTaps: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalTaps >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

interface UseTapEngineProps {
  telegramId:       string;
  initialBalance:   number;
  initialEarned:    number;   // separate from balance — tracks total ever earned
  initialEnergy:    number;
  initialTotalTaps: number;
  hasAutoTap:       boolean;
  hasDoubleTap:     boolean;
  config:           GameConfig;
  onParticleSpawn:  (p: Particle) => void;
  onLevelUp?:       (newLevel: number) => void;
}
interface UseTapEngineReturn {
  balance:       number;
  energy:        number;
  isSyncing:     boolean;
  tapCount:      number;
  totalTaps:     number;
  level:         number;
  levelProgress: number;
  handleTap:     (x: number, y: number) => void;
}

export function useTapEngine({
  telegramId, initialBalance, initialEarned, initialEnergy, initialTotalTaps,
  hasAutoTap, hasDoubleTap, config, onParticleSpawn, onLevelUp,
}: UseTapEngineProps): UseTapEngineReturn {

  const [balance,   setBalance]   = useState(initialBalance);
  const [energy,    setEnergy]    = useState(initialEnergy);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tapCount,  setTapCount]  = useState(0);
  const [totalTaps, setTotalTaps] = useState(initialTotalTaps);
  const [level,     setLevel]     = useState(() => calcLevel(initialTotalTaps));

  // Use refs to avoid stale closures inside intervals/callbacks
  const localBalance   = useRef(initialBalance);
  const localEarned    = useRef(initialEarned);   // cumulative total earned (never decreases)
  const localEnergy    = useRef(initialEnergy);
  const localTotalTaps = useRef(initialTotalTaps);
  const coinsPerTapRef = useRef(hasDoubleTap ? 2 : config.coinsPerTap);
  const syncTimer      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const energyTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTapTimer   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep coinsPerTap ref up to date so no stale closures
  useEffect(() => {
    coinsPerTapRef.current = hasDoubleTap ? 2 : config.coinsPerTap;
  }, [hasDoubleTap, config.coinsPerTap]);

  // Sync initial values when profile first loads
  useEffect(() => {
    localBalance.current   = initialBalance;
    localEarned.current    = initialEarned;
    localEnergy.current    = initialEnergy;
    localTotalTaps.current = initialTotalTaps;
    setBalance(initialBalance);
    setEnergy(initialEnergy);
    setTotalTaps(initialTotalTaps);
    setLevel(calcLevel(initialTotalTaps));
  }, [initialBalance, initialEarned, initialEnergy, initialTotalTaps]);

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
    const coins = coinsPerTapRef.current; // always fresh value via ref

    if (!isAuto) haptic.tap();

    localEnergy.current      -= config.energyPerTap;
    localBalance.current     += coins;
    localEarned.current      += coins; // track total earned separately
    localTotalTaps.current   += 1;

    setBalance(Math.round(localBalance.current));
    setEnergy(Math.floor(localEnergy.current));
    setTapCount(c => c + 1);
    setTotalTaps(prev => {
      const next     = prev + 1;
      const newLevel = calcLevel(next);
      setLevel(cur => {
        if (newLevel > cur) { onLevelUp?.(newLevel); haptic.success(); }
        return newLevel;
      });
      return next;
    });

    if (!isAuto) {
      onParticleSpawn({
        id:        `p-${Date.now()}-${Math.random()}`, x, y,
        vx:        (Math.random() - 0.5) * 60,
        vy:        -(40 + Math.random() * 40),
        value:     coins,   // shows correct +1 or +2 in particle
        opacity:   1, rotation: (Math.random() - 0.5) * 30,
        scale:     0.9 + Math.random() * 0.4,
        createdAt: Date.now(), type: 'text',
      });
    }
  }, [config.energyPerTap, onParticleSpawn, onLevelUp]);

  // Auto tap
  useEffect(() => {
    if (!hasAutoTap) return;
    autoTapTimer.current = setInterval(() => {
      if (localEnergy.current >= config.energyPerTap) doTap(0, 0, true);
    }, 1000);
    return () => { if (autoTapTimer.current) clearInterval(autoTapTimer.current); };
  }, [hasAutoTap, doTap, config.energyPerTap]);

  // Sync to Firestore
  const syncToFirestore = useCallback(async () => {
    if (!telegramId || telegramId === 'guest') return;
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'users', telegramId), {
        balance:          Math.round(localBalance.current),
        totalEarned:      Math.round(localEarned.current),  // correct total earned
        energyAtLastSync: Math.floor(localEnergy.current),
        lastSyncAt:       Date.now(),
        totalTaps:        localTotalTaps.current,
        tapLevel:         calcLevel(localTotalTaps.current),
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

  const tierEnd      = LEVEL_THRESHOLDS[level] ?? 200_000;
  const tierStart    = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const levelProgress = Math.min(1, (totalTaps - tierStart) / (tierEnd - tierStart));

  return { balance, energy, isSyncing, tapCount, totalTaps, level, levelProgress, handleTap };
}
