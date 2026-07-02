# -*- coding: utf-8 -*-
import os, sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def write(path, content):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK " + path)

# ── useTelegramUser.ts: guest mode fallback so app works even if Firestore fails
write("src/hooks/useTelegramUser.ts", """\
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTelegramUser, getInitData } from '@/lib/telegram';
import type { TelegramUser, UserProfile } from '@/models/types';

interface UseTelegramUserReturn {
  telegramUser:  TelegramUser | null;
  userProfile:   UserProfile | null;
  isLoading:     boolean;
  error:         string | null;
  isGuestMode:   boolean;
  refetch:       () => Promise<void>;
}

function buildGuestProfile(tgUser: TelegramUser): UserProfile {
  return {
    telegramId:       String(tgUser.id),
    username:         tgUser.username   ?? '',
    firstName:        tgUser.first_name ?? 'Player',
    lastName:         tgUser.last_name,
    photoUrl:         tgUser.photo_url,
    balance:          0,
    totalEarned:      0,
    energyAtLastSync: 1000,
    lastSyncAt:       Date.now(),
    role:             'user',
    createdAt:        Date.now(),
    dailyEarned:      0,
    dailyResetAt:     Date.now(),
    tapLevel:         1,
    energyLevel:      1,
  };
}

export function useTelegramUser(): UseTelegramUserReturn {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isGuestMode,  setIsGuestMode]  = useState(false);

  const fetchOrCreateProfile = useCallback(async (tgUser: TelegramUser) => {
    const uid = String(tgUser.id);
    const ref = doc(db, 'users', uid);

    try {
      const snap = await getDoc(ref);
      const now  = Date.now();

      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
        setIsGuestMode(false);
      } else {
        const initData    = getInitData();
        const startParam  = initData.split('&').find(p => p.startsWith('start_param='));
        const referrerId  = startParam ? startParam.replace('start_param=', '') : undefined;

        const newProfile: UserProfile = {
          telegramId:       uid,
          username:         tgUser.username   ?? '',
          firstName:        tgUser.first_name ?? 'Player',
          lastName:         tgUser.last_name,
          photoUrl:         tgUser.photo_url,
          balance:          0,
          totalEarned:      0,
          energyAtLastSync: 1000,
          lastSyncAt:       now,
          role:             'user',
          createdAt:        now,
          referrerId,
          dailyEarned:      0,
          dailyResetAt:     now,
          tapLevel:         1,
          energyLevel:      1,
        };
        await setDoc(ref, { ...newProfile, serverTimestamp: serverTimestamp() });
        setUserProfile(newProfile);
        setIsGuestMode(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[BonusByte] Firestore unavailable, using guest mode:', msg);
      // Fall back to local guest profile — app fully works, state resets on refresh
      setUserProfile(buildGuestProfile(tgUser));
      setIsGuestMode(true);
    }
  }, []);

  const refetch = useCallback(async () => {
    const tgUser = getTelegramUser();
    if (!tgUser) return;
    setIsLoading(true);
    await fetchOrCreateProfile(tgUser);
    setIsLoading(false);
  }, [fetchOrCreateProfile]);

  useEffect(() => {
    const tgUser = getTelegramUser();

    // Dev mode fallback
    const devUser: TelegramUser = {
      id: 999999999, first_name: 'Dev', username: 'devuser', language_code: 'en',
    };
    const user = tgUser ?? (import.meta.env.DEV ? devUser : null);

    if (!user) {
      setError('Open BonusByte through Telegram.');
      setIsLoading(false);
      return;
    }

    setTelegramUser(user);
    fetchOrCreateProfile(user).finally(() => setIsLoading(false));
  }, [fetchOrCreateProfile]);

  return { telegramUser, userProfile, isLoading, error, isGuestMode, refetch };
}
""")

# ── Home.tsx: show guest mode banner, remove error gate for guest users
write("src/pages/Home.tsx", """\
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

const SPIN = '@keyframes bb-spin{to{transform:rotate(360deg)}}';

export default function Home() {
  const { userProfile, isLoading, error, isGuestMode } = useTelegramUser();
  const [particles, setParticles] = useState<Particle[]>([]);

  const onParticleSpawn = useCallback((p: Particle) => {
    setParticles(prev => [...prev.slice(-30), p]);
  }, []);
  const onParticleEnd = useCallback((id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const { balance, energy, tapCount, handleTap, isSyncing } = useTapEngine({
    telegramId:      userProfile?.telegramId ?? 'guest',
    initialBalance:  userProfile?.balance    ?? 0,
    initialEnergy:   userProfile?.energyAtLastSync ?? DEFAULT_CONFIG.maxEnergy,
    config:          DEFAULT_CONFIG,
    onParticleSpawn: onParticleSpawn,
  });

  /* Loading */
  if (isLoading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:12,background:'#000'}}>
      <style>{SPIN}</style>
      <div style={{width:32,height:32,border:'2px solid #9A9A9A',
        borderTopColor:'transparent',borderRadius:'50%',
        animation:'bb-spin 0.8s linear infinite'}}/>
      <p style={{color:'#5A6A79',fontSize:13,margin:0}}>Loading...</p>
    </div>
  );

  /* Hard error (not in Telegram) */
  if (error && !userProfile) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:16,padding:'0 24px',
      background:'#000',textAlign:'center'}}>
      <img src="/logo.png" alt="" style={{width:48,opacity:0.4}}/>
      <p style={{color:'#EF5350',fontSize:15,fontWeight:700,margin:0}}>Error</p>
      <p style={{color:'#9A9A9A',fontSize:12,background:'#111',padding:'12px 16px',
        borderRadius:8,border:'1px solid #333',lineHeight:1.6,maxWidth:300,margin:0}}>
        {error}
      </p>
      <button onClick={()=>window.location.reload()} style={{
        background:'#1A1A1D',border:'1px solid #444',color:'#E8E8E8',
        borderRadius:8,padding:'10px 24px',fontSize:13,cursor:'pointer'}}>
        Retry
      </button>
    </div>
  );

  const energyRatio = energy / DEFAULT_CONFIG.maxEnergy;

  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column',
      height:'100%',
      background:'radial-gradient(ellipse 80% 50% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
      <style>{SPIN}</style>
      <PhysicsCanvas particles={particles} onParticleEnd={onParticleEnd}/>

      {/* Guest mode banner */}
      {isGuestMode && (
        <div style={{background:'rgba(255,167,38,0.12)',borderBottom:'1px solid rgba(255,167,38,0.3)',
          padding:'6px 16px',textAlign:'center',position:'relative',zIndex:20}}>
          <p style={{color:'#FFA726',fontSize:10,margin:0,fontWeight:600}}>
            OFFLINE MODE - Data saves when database is connected
          </p>
        </div>
      )}

      {/* Top bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'12px 20px 8px',position:'relative',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,lineHeight:1,margin:0}}>
              {userProfile?.firstName ?? 'Player'}
            </p>
            <p style={{color:'#5A6A79',fontSize:10,margin:0}}>
              Level {userProfile?.tapLevel ?? 1}
            </p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {isSyncing && !isGuestMode && (
            <div style={{width:14,height:14,border:'1.5px solid #4FC3F7',
              borderTopColor:'transparent',borderRadius:'50%',
              animation:'bb-spin 0.8s linear infinite'}}/>
          )}
          <TonConnectButton/>
        </div>
      </div>

      {/* Balance */}
      <div style={{textAlign:'center',padding:'4px 20px 16px',position:'relative',zIndex:10}}>
        <p style={{color:'#5A6A79',fontSize:11,textTransform:'uppercase',
          letterSpacing:'0.1em',margin:'0 0 4px'}}>Balance</p>
        <h1 style={{
          fontSize:'clamp(2rem,8vw,3rem)',fontWeight:900,letterSpacing:'-0.02em',
          lineHeight:1,margin:'0 0 4px',
          background:'linear-gradient(135deg,#8C8C8C 0%,#E8E8E8 25%,#C0C0C0 50%,#F5F5F5 75%,#9A9A9A 100%)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {balance.toLocaleString()}
        </h1>
        <p style={{color:'#5A6A79',fontSize:14,fontWeight:600,margin:0}}>BB Coins</p>
      </div>

      {/* Coin */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        perspective:'1000px',position:'relative',zIndex:10}}>
        <TapCoin onTap={handleTap} energyRatio={energyRatio} tapCount={tapCount}/>
      </div>

      {/* Energy */}
      <div style={{position:'relative',zIndex:10}}>
        <EnergyBar energy={energy} maxEnergy={DEFAULT_CONFIG.maxEnergy}/>
      </div>

      <Navigation/>
    </div>
  );
}
""")

print("")
print("Done! Now:")
print("  git add -A")
print('  git commit -m "fix: guest mode fallback when Firestore unreachable"')
print("  git push origin main")
