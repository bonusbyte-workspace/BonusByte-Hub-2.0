import { useState, useCallback, useEffect } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { useTapEngine } from '@/hooks/useTapEngine';
import { DEFAULT_CONFIG } from '@/models/types';
import TapCoin from '@/components/TapCoin/TapCoin';
import EnergyBar from '@/components/EnergyBar/EnergyBar';
import PhysicsCanvas from '@/components/PhysicsCanvas/PhysicsCanvas';
import Navigation from '@/components/Navigation/Navigation';
import type { Particle } from '@/models/types';

const SPIN  = '@keyframes bb-spin{to{transform:rotate(360deg)}}';
const PULSE = '@keyframes bb-pulse{0%,100%{opacity:1}50%{opacity:0.5}}';

const UPGRADES = [
  { key: 'hasAutoTap',   icon: '🤖', label: 'Auto Tap Bot',  desc: 'Taps automatically every second',   price: 50_000, color: '#4FC3F7' },
  { key: 'hasDoubleTap', icon: '2x', label: 'Double Tap',    desc: '2x coins per tap — forever',         price: 20_000, color: '#D4AF37' },
];

const LEVEL_THRESHOLDS = [0, 50_000, 100_000];
const LEVEL_NAMES      = ['Beginner', 'Advanced', 'Elite'];

export default function Home() {
  const { userProfile, isLoading, error, isGuestMode, guestReason, refetch } = useTelegramUser();
  const [particles,   setParticles]   = useState<Particle[]>([]);
  const [showReason,  setShowReason]  = useState(false);
  const [showShop,    setShowShop]    = useState(false);
  const [levelUpMsg,  setLevelUpMsg]  = useState<string | null>(null);
  const [buying,      setBuying]      = useState<string | null>(null);
  const [ownedMap,    setOwnedMap]    = useState({ hasAutoTap: false, hasDoubleTap: false });

  useEffect(() => {
    if (userProfile) {
      setOwnedMap({
        hasAutoTap:   Boolean((userProfile as Record<string,unknown>).hasAutoTap),
        hasDoubleTap: Boolean((userProfile as Record<string,unknown>).hasDoubleTap),
      });
    }
  }, [userProfile]);

  const onSpawn    = useCallback((p: Particle) => setParticles(prev => [...prev.slice(-30), p]), []);
  const onEnd      = useCallback((id: string)  => setParticles(prev => prev.filter(p => p.id !== id)), []);
  const onLevelUp  = useCallback((lv: number)  => {
    setLevelUpMsg(`Level ${lv} — ${LEVEL_NAMES[lv-1] ?? 'Elite'}!`);
    setTimeout(() => setLevelUpMsg(null), 3000);
  }, []);

  const { balance, energy, tapCount, totalTaps, level, levelProgress, handleTap, isSyncing } = useTapEngine({
    telegramId:       userProfile?.telegramId ?? 'guest',
    initialBalance:   userProfile?.balance    ?? 0,
    initialEnergy:    userProfile?.energyAtLastSync ?? DEFAULT_CONFIG.maxEnergy,
    initialTotalTaps: Number((userProfile as Record<string,unknown>|null)?.totalTaps ?? 0),
    hasAutoTap:       ownedMap.hasAutoTap,
    hasDoubleTap:     ownedMap.hasDoubleTap,
    config:           DEFAULT_CONFIG,
    onParticleSpawn:  onSpawn,
    onLevelUp,
  });

  const buyUpgrade = async (key: string, price: number) => {
    if (!userProfile?.telegramId || balance < price || buying) return;
    setBuying(key);
    try {
      const ref  = doc(db, 'users', userProfile.telegramId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const cur = snap.data().balance ?? 0;
      if (cur < price) return;
      await setDoc(ref, { balance: cur - price, [key]: true }, { merge: true });
      setOwnedMap(prev => ({ ...prev, [key]: true }));
    } catch { /* silent */ } finally { setBuying(null); }
  };

  const tierEnd   = LEVEL_THRESHOLDS[level] ?? 200_000;
  const tierStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const tapsToNext = level < 3 ? Math.max(0, tierEnd - totalTaps) : 0;

  if (isLoading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12,background:'#000'}}>
      <style>{SPIN}</style>
      <div style={{width:32,height:32,border:'2px solid #9A9A9A',borderTopColor:'transparent',borderRadius:'50%',animation:'bb-spin 0.8s linear infinite'}}/>
      <p style={{color:'#5A6A79',fontSize:13,margin:0}}>Loading...</p>
    </div>
  );

  if (error && !userProfile) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',background:'#000',padding:'0 24px'}}>
      <p style={{color:'#EF5350',fontSize:14,textAlign:'center'}}>{error}</p>
    </div>
  );

  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column',height:'100%',
      background:'radial-gradient(ellipse 80% 50% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
      <style>{SPIN+PULSE}</style>
      <PhysicsCanvas particles={particles} onParticleEnd={onEnd}/>

      {/* Level up toast */}
      {levelUpMsg && (
        <div style={{position:'absolute',top:80,left:'50%',transform:'translateX(-50%)',
          background:'linear-gradient(135deg,#D4AF37,#FFD700)',color:'#111',
          padding:'8px 20px',borderRadius:20,fontSize:13,fontWeight:900,
          zIndex:50,boxShadow:'0 4px 20px rgba(212,175,55,0.5)',whiteSpace:'nowrap'}}>
          {levelUpMsg}
        </div>
      )}

      {/* Guest banner */}
      {isGuestMode && (
        <div onClick={() => setShowReason(r => !r)}
          style={{background:'rgba(255,152,0,0.12)',borderBottom:'1px solid rgba(255,152,0,0.3)',
            padding:'5px 16px',textAlign:'center',zIndex:20,cursor:'pointer',position:'relative'}}>
          <p style={{color:'#FFA726',fontSize:10,margin:0,fontWeight:700}}>
            OFFLINE {showReason ? '(hide)' : '(tap for error)'}
          </p>
          {showReason && (<>
            <p style={{color:'#FF7043',fontSize:9,margin:'3px 0 0',wordBreak:'break-all',lineHeight:1.4}}>{guestReason}</p>
            <button onClick={e=>{e.stopPropagation();refetch();}} style={{marginTop:4,
              background:'rgba(255,152,0,0.2)',border:'1px solid #FFA726',color:'#FFA726',
              borderRadius:4,padding:'2px 12px',fontSize:9,cursor:'pointer'}}>Retry</button>
          </>)}
        </div>
      )}

      {/* Top bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        paddingTop:'max(48px,calc(env(safe-area-inset-top,0px)+48px))',
        paddingLeft:20,paddingRight:20,paddingBottom:8,position:'relative',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,lineHeight:1,margin:0}}>
              {userProfile?.firstName ?? 'Player'}
            </p>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <span style={{background:'linear-gradient(135deg,#D4AF37,#FFD700)',color:'#111',
                fontSize:9,fontWeight:900,padding:'1px 7px',borderRadius:10}}>
                LV {level}
              </span>
              <span style={{color:'#5A6A79',fontSize:9}}>{LEVEL_NAMES[level-1]}</span>
              {ownedMap.hasAutoTap && (
                <span style={{color:'#4FC3F7',fontSize:9,animation:'bb-pulse 1.5s infinite'}}>AUTO</span>
              )}
              {ownedMap.hasDoubleTap && (
                <span style={{color:'#D4AF37',fontSize:9,fontWeight:900}}>2x</span>
              )}
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {isSyncing && !isGuestMode && (
            <div style={{width:14,height:14,border:'1.5px solid #4FC3F7',borderTopColor:'transparent',
              borderRadius:'50%',animation:'bb-spin 0.8s linear infinite'}}/>
          )}
          {/* Shop button */}
          <button onClick={() => setShowShop(true)}
            style={{background:'rgba(26,26,29,0.9)',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:10,padding:'6px 12px',cursor:'pointer',fontSize:13,color:'#E8E8E8'}}>
            🛒
          </button>
          <TonConnectButton/>
        </div>
      </div>

      {/* Level progress bar */}
      {level < 3 && (
        <div style={{paddingLeft:20,paddingRight:20,paddingBottom:4,zIndex:10}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{color:'#3A3A45',fontSize:9}}>{totalTaps.toLocaleString()} taps</span>
            <span style={{color:'#3A3A45',fontSize:9}}>
              {tapsToNext.toLocaleString()} to Lv {level+1}
            </span>
          </div>
          <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:2,
              background:'linear-gradient(90deg,#D4AF37,#FFD700)',
              width: (levelProgress * 100)+'%',transition:'width 0.5s ease'}}/>
          </div>
        </div>
      )}

      {/* Balance */}
      <div style={{textAlign:'center',padding:'4px 20px 12px',position:'relative',zIndex:10}}>
        <p style={{color:'#5A6A79',fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 4px'}}>Balance</p>
        <h1 style={{fontSize:'clamp(2rem,8vw,3rem)',fontWeight:900,letterSpacing:'-0.02em',lineHeight:1,margin:'0 0 4px',
          background:'linear-gradient(135deg,#8C8C8C 0%,#E8E8E8 25%,#C0C0C0 50%,#F5F5F5 75%,#9A9A9A 100%)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {balance.toLocaleString()}
        </h1>
        <p style={{color:'#5A6A79',fontSize:14,fontWeight:600,margin:0}}>BB Coins</p>
      </div>

      {/* Coin */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        perspective:'1000px',position:'relative',zIndex:10}}>
        <TapCoin onTap={handleTap} energyRatio={energy/DEFAULT_CONFIG.maxEnergy} tapCount={tapCount}/>
      </div>

      {/* Energy */}
      <div style={{position:'relative',zIndex:10}}>
        <EnergyBar energy={energy} maxEnergy={DEFAULT_CONFIG.maxEnergy}/>
      </div>

      <Navigation/>

      {/* Shop Modal */}
      {showShop && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:100,
          display:'flex',flexDirection:'column',justifyContent:'flex-end'}}
          onClick={() => setShowShop(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{background:'linear-gradient(180deg,#141418,#0A0A0E)',
              borderRadius:'20px 20px 0 0',border:'1px solid rgba(255,255,255,0.08)',
              padding:'20px 20px 40px'}}>

            <div style={{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,0.15)',
              margin:'0 auto 20px'}}/>

            <h3 style={{fontSize:16,fontWeight:900,margin:'0 0 4px',
              background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Power-Ups Shop
            </h3>
            <p style={{color:'#5A6A79',fontSize:11,margin:'0 0 20px'}}>
              Your balance: {balance.toLocaleString()} BB
            </p>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {UPGRADES.map(u => {
                const owned    = ownedMap[u.key as keyof typeof ownedMap];
                const canAfford= balance >= u.price;
                const loading  = buying === u.key;
                return (
                  <div key={u.key} style={{
                    background: owned
                      ? `linear-gradient(145deg,${u.color}15,rgba(17,17,19,0.95))`
                      : 'linear-gradient(145deg,#1A1A1D,#111113)',
                    border:`1px solid ${owned ? u.color+'44' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius:14,padding:'14px 16px',
                    display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:12,flexShrink:0,
                      background:`${u.color}15`,display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:22,fontWeight:900,color:u.color}}>
                      {u.icon}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{color:'#D0D0D0',fontSize:13,fontWeight:700,margin:'0 0 2px'}}>{u.label}</p>
                      <p style={{color:'#5A6A79',fontSize:11,margin:0}}>{u.desc}</p>
                      {!owned && (
                        <p style={{color:u.color,fontSize:11,fontWeight:700,margin:'3px 0 0'}}>
                          {u.price.toLocaleString()} BB
                        </p>
                      )}
                    </div>
                    {owned ? (
                      <span style={{color:u.color,fontSize:11,fontWeight:900,flexShrink:0}}>OWNED</span>
                    ) : (
                      <button onClick={() => buyUpgrade(u.key, u.price)}
                        disabled={!canAfford || !!buying}
                        style={{flexShrink:0,padding:'8px 16px',borderRadius:10,border:'none',
                          fontWeight:700,fontSize:12,cursor:canAfford?'pointer':'not-allowed',
                          background:canAfford?`linear-gradient(135deg,${u.color}CC,${u.color}88)`:'rgba(42,42,45,0.8)',
                          color:canAfford?'#111':'#5A6A79',opacity:loading?0.6:1}}>
                        {loading ? '...' : canAfford ? 'Buy' : 'Need more BB'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
