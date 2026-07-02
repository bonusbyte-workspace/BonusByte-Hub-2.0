# -*- coding: utf-8 -*-
import os, sys

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def write(path, content):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK " + path)

# ── 1. ErrorBoundary.tsx ──────────────────────────────────────
write("src/components/ErrorBoundary.tsx", """\
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error) { console.error('[BonusByte]', error); }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{
        position:'fixed',inset:0,background:'#000',display:'flex',
        flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:24,fontFamily:'monospace',
      }}>
        <img src="/logo.png" alt="" style={{width:48,marginBottom:16,opacity:0.5}} />
        <p style={{color:'#EF5350',fontWeight:800,fontSize:14,marginBottom:8}}>App Crashed</p>
        <div style={{
          color:'#9A9A9A',fontSize:11,textAlign:'center',
          background:'#111',padding:'12px 16px',borderRadius:8,
          border:'1px solid #333',maxWidth:340,wordBreak:'break-word',lineHeight:1.7,
        }}>
          {error.message}
        </div>
        <button onClick={()=>window.location.reload()} style={{
          marginTop:20,background:'linear-gradient(180deg,#D0D0D0,#9A9A9A)',
          border:'none',borderRadius:8,padding:'10px 28px',
          fontWeight:700,fontSize:13,cursor:'pointer',color:'#111',
        }}>Reload</button>
      </div>
    );
  }
}
""")

# ── 2. App.tsx ───────────────────────────────────────────────
write("src/App.tsx", """\
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider, TonConnectButton } from '@tonconnect/ui-react';
import SplashScreen  from '@/components/SplashScreen/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home          from '@/pages/Home';
import StakingPage   from '@/pages/Staking';
import AdminPage     from '@/pages/admin/AdminPage';
import Leaderboard   from '@/components/Leaderboard/Leaderboard';
import Navigation    from '@/components/Navigation/Navigation';
import { initTelegram } from '@/lib/telegram';

const ADMIN_ROUTE  = import.meta.env.VITE_ADMIN_ROUTE || '/bb-nexus-7k';
const TON_MANIFEST = window.location.origin + '/tonconnect-manifest.json';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => { initTelegram(); }, []);

  return (
    <ErrorBoundary>
      <TonConnectUIProvider manifestUrl={TON_MANIFEST}>
        <div className="app-container">
          {!splashDone ? (
            <SplashScreen onComplete={() => setSplashDone(true)} />
          ) : (
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/leaderboard" element={
                    <div className="flex flex-col h-full"
                      style={{background:'radial-gradient(ellipse 80% 40% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
                      <Leaderboard /><Navigation />
                    </div>
                  }/>
                  <Route path="/staking" element={<StakingPage />} />
                  <Route path="/wallet" element={
                    <div className="flex flex-col h-full" style={{background:'#000'}}>
                      <div style={{flex:1,display:'flex',flexDirection:'column',
                        alignItems:'center',justifyContent:'center',gap:20,padding:'0 24px'}}>
                        <img src="/logo.png" alt="" style={{width:56,opacity:0.8}} />
                        <div style={{textAlign:'center'}}>
                          <h2 style={{fontSize:20,fontWeight:900,color:'#E8E8E8',marginBottom:6}}>
                            TON Wallet
                          </h2>
                          <p style={{fontSize:13,color:'#5A6A79'}}>
                            Connect to link your staking rewards
                          </p>
                        </div>
                        <TonConnectButton />
                      </div>
                      <Navigation />
                    </div>
                  }/>
                  <Route path={ADMIN_ROUTE} element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          )}
        </div>
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}
""")

# ── 3. Home.tsx ──────────────────────────────────────────────
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

const SPIN = `@keyframes bb-spin{to{transform:rotate(360deg)}}`;

export default function Home() {
  const { userProfile, isLoading, error } = useTelegramUser();
  const [particles, setParticles] = useState<Particle[]>([]);

  const handleParticleSpawn = useCallback((p: Particle) => {
    setParticles(prev => [...prev.slice(-30), p]);
  }, []);
  const handleParticleEnd = useCallback((id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const { balance, energy, tapCount, handleTap, isSyncing } = useTapEngine({
    telegramId:      userProfile?.telegramId ?? 'guest',
    initialBalance:  userProfile?.balance    ?? 0,
    initialEnergy:   userProfile?.energyAtLastSync ?? DEFAULT_CONFIG.maxEnergy,
    config:          DEFAULT_CONFIG,
    onParticleSpawn: handleParticleSpawn,
  });

  if (isLoading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:12,background:'#000'}}>
      <style>{SPIN}</style>
      <div style={{width:32,height:32,border:'2px solid #9A9A9A',
        borderTopColor:'transparent',borderRadius:'50%',
        animation:'bb-spin 0.8s linear infinite'}} />
      <p style={{color:'#5A6A79',fontSize:13}}>Loading profile...</p>
    </div>
  );

  if (error) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:16,padding:'0 24px',
      background:'#000',textAlign:'center'}}>
      <img src="/logo.png" alt="" style={{width:48,opacity:0.4}} />
      <p style={{color:'#EF5350',fontSize:15,fontWeight:700}}>Profile Error</p>
      <p style={{color:'#9A9A9A',fontSize:12,background:'#111',padding:'12px 16px',
        borderRadius:8,border:'1px solid #333',lineHeight:1.6,maxWidth:300}}>{error}</p>
      <button onClick={()=>window.location.reload()}
        style={{background:'#1A1A1D',border:'1px solid #444',color:'#E8E8E8',
          borderRadius:8,padding:'10px 24px',fontSize:13,cursor:'pointer'}}>
        Retry
      </button>
    </div>
  );

  const energyRatio = energy / DEFAULT_CONFIG.maxEnergy;

  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column',
      height:'100%',background:'radial-gradient(ellipse 80% 50% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
      <style>{SPIN}</style>
      <PhysicsCanvas particles={particles} onParticleEnd={handleParticleEnd} />

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'16px 20px 8px',position:'relative',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}} />
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
          {isSyncing && (
            <div style={{width:14,height:14,border:'1.5px solid #4FC3F7',
              borderTopColor:'transparent',borderRadius:'50%',
              animation:'bb-spin 0.8s linear infinite'}} />
          )}
          <TonConnectButton />
        </div>
      </div>

      <div style={{textAlign:'center',padding:'0 20px 16px',position:'relative',zIndex:10}}>
        <p style={{color:'#5A6A79',fontSize:11,textTransform:'uppercase',
          letterSpacing:'0.1em',marginBottom:4}}>Balance</p>
        <h1 style={{
          fontSize:'clamp(2rem,8vw,3rem)',fontWeight:900,letterSpacing:'-0.02em',
          lineHeight:1,margin:'0 0 4px',
          background:'linear-gradient(135deg,#8C8C8C 0%,#E8E8E8 25%,#C0C0C0 50%,#F5F5F5 75%,#9A9A9A 100%)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
        }}>
          {balance.toLocaleString()}
        </h1>
        <p style={{color:'#5A6A79',fontSize:14,fontWeight:600,margin:0}}>BB Coins</p>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        perspective:'1000px',position:'relative',zIndex:10}}>
        <TapCoin onTap={handleTap} energyRatio={energyRatio} tapCount={tapCount} />
      </div>

      <div style={{position:'relative',zIndex:10}}>
        <EnergyBar energy={energy} maxEnergy={DEFAULT_CONFIG.maxEnergy} />
      </div>

      <Navigation />
    </div>
  );
}
""")

# ── 4. API .js import extensions ────────────────────────────
api_fixes = {
    "api/sync.ts": [
        ("from './_lib/adminAuth'", "from './_lib/adminAuth.js'"),
        ("from './_lib/firebase'",  "from './_lib/firebase.js'"),
    ],
    "api/stake.ts": [
        ("from './_lib/adminAuth'", "from './_lib/adminAuth.js'"),
        ("from './_lib/firebase'",  "from './_lib/firebase.js'"),
    ],
    "api/leaderboard.ts": [
        ("from './_lib/firebase'",  "from './_lib/firebase.js'"),
    ],
    "api/_lib/adminAuth.ts": [
        ("import('./firebase')",    "import('./firebase.js')"),
    ],
}
for fpath, replacements in api_fixes.items():
    if os.path.exists(fpath):
        content = open(fpath, encoding="utf-8").read()
        for old, new in replacements:
            content = content.replace(old, new)
        open(fpath, "w", encoding="utf-8").write(content)
        print("OK " + fpath)
    else:
        print("SKIP (not found): " + fpath)

print("")
print("All fixes applied. Now run:")
print("  git add -A")
print('  git commit -m "fix: ErrorBoundary + nested TonConnect + robust Home"')
print("  git push origin main")
