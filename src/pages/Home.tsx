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
  const { userProfile, isLoading, error, isGuestMode, guestReason, refetch } = useTelegramUser();
  const [particles, setParticles]   = useState<Particle[]>([]);
  const [showReason, setShowReason] = useState(false);

  const onSpawn = useCallback((p: Particle) => setParticles(prev => [...prev.slice(-30), p]), []);
  const onEnd   = useCallback((id: string)  => setParticles(prev => prev.filter(p => p.id !== id)), []);

  const { balance, energy, tapCount, handleTap, isSyncing } = useTapEngine({
    telegramId:      userProfile?.telegramId ?? 'guest',
    initialBalance:  userProfile?.balance    ?? 0,
    initialEnergy:   userProfile?.energyAtLastSync ?? DEFAULT_CONFIG.maxEnergy,
    config:          DEFAULT_CONFIG,
    onParticleSpawn: onSpawn,
  });

  if (isLoading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      height:'100%',gap:12,background:'#000'}}>
      <style>{SPIN}</style>
      <div style={{width:32,height:32,border:'2px solid #9A9A9A',borderTopColor:'transparent',
        borderRadius:'50%',animation:'bb-spin 0.8s linear infinite'}}/>
      <p style={{color:'#5A6A79',fontSize:13,margin:0}}>Loading...</p>
    </div>
  );

  if (error && !userProfile) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',
      height:'100%',background:'#000',padding:'0 24px'}}>
      <p style={{color:'#EF5350',fontSize:14,textAlign:'center'}}>{error}</p>
    </div>
  );

  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column',height:'100%',
      background:'radial-gradient(ellipse 80% 50% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
      <style>{SPIN}</style>
      <PhysicsCanvas particles={particles} onParticleEnd={onEnd}/>

      {isGuestMode && (
        <div onClick={() => setShowReason(r => !r)}
          style={{background:'rgba(255,152,0,0.12)',borderBottom:'1px solid rgba(255,152,0,0.35)',
            padding:'5px 16px',textAlign:'center',zIndex:20,cursor:'pointer',position:'relative'}}>
          <p style={{color:'#FFA726',fontSize:10,margin:0,fontWeight:700}}>
            OFFLINE  {showReason ? '(hide)' : '(tap for error)'}
          </p>
          {showReason && (
            <>
              <p style={{color:'#FF7043',fontSize:9,margin:'3px 0 0',
                wordBreak:'break-all',lineHeight:1.4}}>{guestReason}</p>
              <button onClick={e=>{e.stopPropagation();refetch();}}
                style={{marginTop:4,background:'rgba(255,152,0,0.2)',
                  border:'1px solid #FFA726',color:'#FFA726',
                  borderRadius:4,padding:'2px 12px',fontSize:9,cursor:'pointer'}}>
                Retry
              </button>
            </>
          )}
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'12px 20px 8px',position:'relative',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,lineHeight:1,margin:0}}>
              {userProfile?.firstName ?? 'Player'}
            </p>
            <p style={{color:'#5A6A79',fontSize:10,margin:0}}>
              Lv {userProfile?.tapLevel ?? 1}{isGuestMode ? ' · offline' : ''}
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

      <div style={{textAlign:'center',padding:'4px 20px 12px',position:'relative',zIndex:10}}>
        <p style={{color:'#5A6A79',fontSize:11,textTransform:'uppercase',
          letterSpacing:'0.1em',margin:'0 0 4px'}}>Balance</p>
        <h1 style={{fontSize:'clamp(2rem,8vw,3rem)',fontWeight:900,letterSpacing:'-0.02em',
          lineHeight:1,margin:'0 0 4px',
          background:'linear-gradient(135deg,#8C8C8C 0%,#E8E8E8 25%,#C0C0C0 50%,#F5F5F5 75%,#9A9A9A 100%)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {balance.toLocaleString()}
        </h1>
        <p style={{color:'#5A6A79',fontSize:14,fontWeight:600,margin:0}}>BB Coins</p>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        perspective:'1000px',position:'relative',zIndex:10}}>
        <TapCoin onTap={handleTap} energyRatio={energy/DEFAULT_CONFIG.maxEnergy} tapCount={tapCount}/>
      </div>

      <div style={{position:'relative',zIndex:10}}>
        <EnergyBar energy={energy} maxEnergy={DEFAULT_CONFIG.maxEnergy}/>
      </div>
      <Navigation/>
    </div>
  );
}
