import { useState, useRef, useCallback, useEffect } from 'react';
import { haptic } from '@/lib/telegram';
import { getInitData } from '@/lib/telegram';
import type { SyncPayload, SyncResponse, GameConfig, Particle } from '@/models/types';

interface UseTapEngineProps {
  telegramId: string;
  initialBalance: number;
  initialEnergy: number;
  config: GameConfig;
  onParticleSpawn: (p: Particle) => void;
}

interface UseTapEngineReturn {
  balance:       number;
  energy:        number;
  isSyncing:     boolean;
  tapCount:      number;
  handleTap:     (x: number, y: number) => void;
}

export function useTapEngine({
  telegramId,
  initialBalance,
  initialEnergy,
  config,
  onParticleSpawn,
}: UseTapEngineProps): UseTapEngineReturn {
  const [balance,   setBalance]   = useState(initialBalance);
  const [energy,    setEnergy]    = useState(initialEnergy);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tapCount,  setTapCount]  = useState(0);

  // Accumulator refs — avoid stale closures
  const pendingClicks  = useRef(0);
  const lastSyncAt     = useRef(Date.now());
  const localBalance   = useRef(initialBalance);
  const localEnergy    = useRef(initialEnergy);
  const syncTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const energyTimer    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Energy Regeneration ────────────────────────────────────
  useEffect(() => {
    energyTimer.current = setInterval(() => {
      localEnergy.current = Math.min(
        config.maxEnergy,
        localEnergy.current + config.regenRate
      );
      setEnergy(Math.floor(localEnergy.current));
    }, 1000);

    return () => {
      if (energyTimer.current) clearInterval(energyTimer.current);
    };
  }, [config.maxEnergy, config.regenRate]);

  // ── Sync to Server ─────────────────────────────────────────
  const syncToServer = useCallback(async (forceSend = false) => {
    if (pendingClicks.current === 0 && !forceSend) return;

    const now      = Date.now();
    const deltaMs  = now - lastSyncAt.current;
    const clicks   = pendingClicks.current;

    pendingClicks.current = 0;
    lastSyncAt.current    = now;

    const payload: SyncPayload = {
      telegramId,
      initData:      getInitData(),
      clicks,
      deltaMs,
      clientEnergy:  Math.floor(localEnergy.current),
      timestamp:     now,
    };

    try {
      setIsSyncing(true);
      const res = await fetch('/api/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (res.ok) {
        const data: SyncResponse = await res.json();
        // Trust server balance for corrections
        localBalance.current = data.balance;
        localEnergy.current  = data.energy;
        setBalance(data.balance);
        setEnergy(data.energy);
      }
    } catch {
      // Silently fail — optimistic state is still valid
    } finally {
      setIsSyncing(false);
    }
  }, [telegramId]);

  // ── Debounced Sync (every 3 seconds) ──────────────────────
  const scheduleSyncOrDelay = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => syncToServer(), 3000);
  }, [syncToServer]);

  // ── Visibility Guard ───────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Attempt sync before memory freeze
        if (navigator.sendBeacon) {
          const payload: SyncPayload = {
            telegramId,
            initData:      getInitData(),
            clicks:        pendingClicks.current,
            deltaMs:       Date.now() - lastSyncAt.current,
            clientEnergy:  Math.floor(localEnergy.current),
            timestamp:     Date.now(),
          };
          navigator.sendBeacon('/api/sync', JSON.stringify(payload));
          pendingClicks.current = 0;
        } else {
          syncToServer(true);
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [syncToServer, telegramId]);

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncToServer(true);
    };
  }, [syncToServer]);

  // ── Main Tap Handler ───────────────────────────────────────
  const handleTap = useCallback((x: number, y: number) => {
    if (localEnergy.current < config.energyPerTap) return;

    // Haptic feedback
    haptic.tap();

    // Optimistic UI update
    localEnergy.current  -= config.energyPerTap;
    localBalance.current += config.coinsPerTap;
    pendingClicks.current++;

    setBalance(Math.round(localBalance.current));
    setEnergy(Math.floor(localEnergy.current));
    setTapCount(c => c + 1);

    // Spawn floating particle
    const particle: Particle = {
      id:        `p-${Date.now()}-${Math.random()}`,
      x,
      y,
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

    // Schedule debounced sync
    scheduleSyncOrDelay();
  }, [config, onParticleSpawn, scheduleSyncOrDelay]);

  return { balance, energy, isSyncing, tapCount, handleTap };
}
