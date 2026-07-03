import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { haptic } from '@/lib/telegram';
import type { GameConfig, Particle } from '@/models/types';

interface UseTapEngineProps {
  telegramId:     string;
  initialBalance: number;
  initialEnergy:  number;
  config:         GameConfig;
  onParticleSpawn:(p: Particle) => void;
}

interface UseTapEngineReturn {
  balance:    number;
  energy:     number;
  isSyncing:  boolean;
  tapCount:   number;
  handleTap:  (x: number, y: number) => void;
}

export function useTapEngine({
  telegramId, initialBalance, initialEnergy, config, onParticleSpawn,
}: UseTapEngineProps): UseTapEngineReturn {
  const [balance,   setBalance]   = useState(initialBalance);
  const [energy,    setEnergy]    = useState(initialEnergy);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tapCount,  setTapCount]  = useState(0);

  const pendingTaps  = useRef(0);
  const localBalance = useRef(initialBalance);
  const localEnergy  = useRef(initialEnergy);
  const lastSyncAt   = useRef(Date.now());
  const syncTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const energyTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sync initial values when profile loads
  useEffect(() => {
    localBalance.current = initialBalance;
    localEnergy.current  = initialEnergy;
    setBalance(initialBalance);
    setEnergy(initialEnergy);
  }, [initialBalance, initialEnergy]);

  // ── Energy regen (client-side)
  useEffect(() => {
    energyTimer.current = setInterval(() => {
      localEnergy.current = Math.min(config.maxEnergy, localEnergy.current + config.regenRate);
      setEnergy(Math.floor(localEnergy.current));
    }, 1000);
    return () => { if (energyTimer.current) clearInterval(energyTimer.current); };
  }, [config.maxEnergy, config.regenRate]);

  // ── Write balance directly to Firestore (no server API needed)
  const syncToFirestore = useCallback(async () => {
    if (pendingTaps.current === 0 || !telegramId || telegramId === 'guest') return;

    const now        = Date.now();
    
    pendingTaps.current = 0;
    lastSyncAt.current  = now;

    try {
      setIsSyncing(true);
      const ref = doc(db, 'users', telegramId);
      await updateDoc(ref, {
        balance:          localBalance.current,
        totalEarned:      localBalance.current,
        energyAtLastSync: Math.floor(localEnergy.current),
        lastSyncAt:       now,
      });
    } catch (err) {
      console.warn('[BB] Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [telegramId, config.coinsPerTap]);

  // ── Debounced sync every 3 seconds
  const scheduleSyncSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(syncToFirestore, 3000);
  }, [syncToFirestore]);

  // ── Visibility guard — sync before app hides
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') syncToFirestore();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [syncToFirestore]);

  // ── Sync on unmount
  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncToFirestore();
    };
  }, [syncToFirestore]);

  // ── Main tap handler
  const handleTap = useCallback((x: number, y: number) => {
    if (localEnergy.current < config.energyPerTap) return;

    haptic.tap();

    localEnergy.current  -= config.energyPerTap;
    localBalance.current += config.coinsPerTap;
    pendingTaps.current  += 1;

    setBalance(Math.round(localBalance.current));
    setEnergy(Math.floor(localEnergy.current));
    setTapCount(c => c + 1);

    const particle: Particle = {
      id:        'p-' + Date.now() + '-' + Math.random(),
      x, y,
      vx:        (Math.random() - 0.5) * 60,
      vy:        -(40 + Math.random() * 40),
      value:     config.coinsPerTap,
      opacity:   1,
      rotation:  (Math.random() - 0.5) * 30,
      scale:     0.9 + Math.random() * 0.4,
      createdAt: Date.now(),
      type:      'text',
    };
    onParticleSpawn(particle);
    scheduleSyncSync();
  }, [config, onParticleSpawn, scheduleSyncSync]);

  return { balance, energy, isSyncing, tapCount, handleTap };
}
