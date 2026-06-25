import { useState, useCallback } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { useTapEngine } from '@/hooks/useTapEngine';
import { DEFAULT_CONFIG } from '@/models/types';
import TapCoin from '@/components/TapCoin/TapCoin';
import EnergyBar from '@/components/EnergyBar/EnergyBar';
import PhysicsCanvas from '@/components/PhysicsCanvas/PhysicsCanvas';
import Navigation from '@/components/Navigation/Navigation';
import type { Particle } from '@/models/types';

export default function Home() {
  const { userProfile, isLoading, error } = useTelegramUser();
  const [particles, setParticles] = useState<Particle[]>([]);

  const handleParticleSpawn = useCallback((p: Particle) => {
    setParticles(prev => [...prev.slice(-30), p]); // cap at 30 concurrent
  }, []);

  const handleParticleEnd = useCallback((id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const {
    balance,
    energy,
    tapCount,
    handleTap,
    isSyncing,
  } = useTapEngine({
    telegramId:     userProfile?.telegramId ?? '',
    initialBalance: userProfile?.balance    ?? 0,
    initialEnergy:  userProfile?.energyAtLastSync ?? DEFAULT_CONFIG.maxEnergy,
    config:         DEFAULT_CONFIG,
    onParticleSpawn: handleParticleSpawn,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-chrome-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-6 text-center">
        <p className="text-steel-400 text-sm">{error}</p>
      </div>
    );
  }

  const energyRatio = energy / DEFAULT_CONFIG.maxEnergy;

  return (
    <div
      className="relative flex flex-col h-full"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, #0D1A2E 0%, #000000 100%)' }}
    >
      {/* Physics particles canvas */}
      <PhysicsCanvas particles={particles} onParticleEnd={handleParticleEnd} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-7 h-7 object-contain" />
          <div>
            <p className="text-chrome-300 text-xs font-bold leading-none">
              {userProfile?.firstName ?? 'Player'}
            </p>
            <p className="text-steel-400 text-[10px]">Level {userProfile?.tapLevel ?? 1}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <div className="w-4 h-4 border border-energy-400 border-t-transparent rounded-full animate-spin opacity-60" />
          )}
          <TonConnectButton />
        </div>
      </div>

      {/* Balance */}
      <div className="text-center px-5 pb-4 z-10">
        <p className="text-steel-400 text-xs uppercase tracking-widest mb-1">Balance</p>
        <h1 className="chrome-text balance-value tabular-nums">
          {balance.toLocaleString()}
        </h1>
        <p className="text-steel-400 text-sm font-semibold">BB Coins</p>
      </div>

      {/* Tap Coin - centered, growing with perspective */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 perspective-scene">
        <TapCoin
          onTap={handleTap}
          energyRatio={energyRatio}
          tapCount={tapCount}
        />
      </div>

      {/* Energy Bar */}
      <div className="z-10 pb-1">
        <EnergyBar energy={energy} maxEnergy={DEFAULT_CONFIG.maxEnergy} />
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
}
