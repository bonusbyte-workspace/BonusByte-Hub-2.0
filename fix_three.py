# -*- coding: utf-8 -*-
import os, sys, subprocess
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def w(path, txt):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("WROTE " + path)

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8")
    if r.stdout.strip(): print(r.stdout.strip())
    if r.stderr.strip(): print(r.stderr.strip())
    return r.returncode

# ══════════════════════════════════════════════════════════════
# FIX 1 — Admin Portal: each role sees only their section
# ══════════════════════════════════════════════════════════════
w("src/components/admin/AdminPortal.tsx", """import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import type { AdminModule } from '@/models/types';
import DeveloperModule from './modules/DeveloperModule';
import SupportModule   from './modules/SupportModule';
import EconomyModule   from './modules/EconomyModule';
import MarketingModule from './modules/MarketingModule';

const ALL_MODULES = [
  { id: 'developer' as AdminModule, label: 'Developer', icon: '⚙️',
    roles: ['developer'] },
  { id: 'support'   as AdminModule, label: 'Support',   icon: '🎧',
    roles: ['developer', 'support'] },
  { id: 'economy'   as AdminModule, label: 'Economy',   icon: '💰',
    roles: ['developer', 'economy'] },
  { id: 'marketing' as AdminModule, label: 'Marketing', icon: '📈',
    roles: ['developer', 'economy', 'support'] },
];

function ModuleContent({ id, adminUser }: { id: AdminModule; adminUser: { uid: string; email: string; role: string } }) {
  switch (id) {
    case 'developer': return <DeveloperModule />;
    case 'support':   return <SupportModule adminUser={adminUser as never} />;
    case 'economy':   return <EconomyModule />;
    case 'marketing': return <MarketingModule />;
    default:          return null;
  }
}

export default function AdminPortal() {
  const { adminUser, logout } = useAuth();

  // Only show tabs this role can access
  const accessible = useMemo(() =>
    ALL_MODULES.filter(m => adminUser && m.roles.includes(adminUser.role)),
    [adminUser]
  );

  // Default to user's own section (first accessible tab)
  const [activeModule, setActiveModule] = useState<AdminModule>(
    () => accessible[0]?.id ?? 'developer'
  );

  if (!adminUser) return null;

  // Ensure activeModule is still accessible (safety check)
  const current = accessible.find(m => m.id === activeModule)
    ? activeModule
    : accessible[0]?.id ?? 'developer';

  return (
    <div style={{position:'fixed',inset:0,background:'#05050A',
      display:'flex',flexDirection:'column',color:'#E8E8E8',overflow:'hidden'}}>

      {/* Top bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'12px 16px',borderBottom:'1px solid #1A1A1D',background:'#0A0A0F'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{margin:0,fontSize:13,fontWeight:900,
              background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              BonusByte Admin
            </p>
            <p style={{margin:0,fontSize:10,color:'#5A6A79',textTransform:'capitalize'}}>
              {adminUser.role} · {adminUser.email}
            </p>
          </div>
        </div>
        <button onClick={logout}
          style={{background:'transparent',border:'1px solid #2A2A2D',color:'#9A9A9A',
            borderRadius:8,padding:'6px 12px',fontSize:11,cursor:'pointer'}}>
          Sign Out
        </button>
      </div>

      {/* Role badge */}
      <div style={{padding:'8px 16px 0',background:'#0A0A0F',
        borderBottom:'1px solid #1A1A1D'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <span style={{
            padding:'2px 10px',borderRadius:20,fontSize:10,fontWeight:700,
            textTransform:'uppercase',letterSpacing:'0.08em',
            background: adminUser.role === 'developer' ? 'rgba(79,195,247,0.15)' :
                        adminUser.role === 'support'   ? 'rgba(165,214,167,0.15)' :
                        'rgba(212,175,55,0.15)',
            color: adminUser.role === 'developer' ? '#4FC3F7' :
                   adminUser.role === 'support'   ? '#A5D6A7' :
                   '#D4AF37',
            border: `1px solid ${
              adminUser.role === 'developer' ? 'rgba(79,195,247,0.3)' :
              adminUser.role === 'support'   ? 'rgba(165,214,167,0.3)' :
              'rgba(212,175,55,0.3)'
            }`,
          }}>
            {adminUser.role}
          </span>
          <span style={{color:'#3A3A3A',fontSize:10}}>
            {accessible.length} section{accessible.length !== 1 ? 's' : ''} accessible
          </span>
        </div>

        {/* Module tabs — only show accessible ones */}
        <div style={{display:'flex',gap:0,overflowX:'auto'}}>
          {accessible.map(mod => (
            <button key={mod.id} onClick={() => setActiveModule(mod.id)}
              style={{
                padding:'8px 16px',fontSize:12,fontWeight:600,
                whiteSpace:'nowrap',background:'transparent',border:'none',
                cursor:'pointer',position:'relative',
                color: current === mod.id ? '#E8E8E8' : '#5A6A79',
                borderBottom: current === mod.id
                  ? '2px solid #4FC3F7' : '2px solid transparent',
                transition:'all 0.15s ease',
              }}>
              <span style={{marginRight:5}}>{mod.icon}</span>
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto'}}>
        <motion.div key={current}
          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          transition={{duration:0.2}}>
          <ModuleContent id={current} adminUser={adminUser}/>
        </motion.div>
      </div>
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════
# FIX 2 — Home.tsx: lower the top section + safe area
# ══════════════════════════════════════════════════════════════
w("src/pages/Home.tsx", """import { useState, useCallback } from 'react';
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
  const [particles,   setParticles]   = useState<Particle[]>([]);
  const [showReason,  setShowReason]  = useState(false);

  const onSpawn = useCallback((p: Particle) => setParticles(prev => [...prev.slice(-30), p]), []);
  const onEnd   = useCallback((id: string) => setParticles(prev => prev.filter(p => p.id !== id)), []);

  const { balance, energy, tapCount, handleTap, isSyncing } = useTapEngine({
    telegramId:      userProfile?.telegramId ?? 'guest',
    initialBalance:  userProfile?.balance    ?? 0,
    initialEnergy:   userProfile?.energyAtLastSync ?? DEFAULT_CONFIG.maxEnergy,
    config:          DEFAULT_CONFIG,
    onParticleSpawn: onSpawn,
  });

  if (isLoading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:12,background:'#000'}}>
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

      {/* Guest mode banner */}
      {isGuestMode && (
        <div onClick={() => setShowReason(r => !r)}
          style={{background:'rgba(255,152,0,0.12)',borderBottom:'1px solid rgba(255,152,0,0.3)',
            padding:'5px 16px',textAlign:'center',zIndex:20,cursor:'pointer',
            position:'relative'}}>
          <p style={{color:'#FFA726',fontSize:10,margin:0,fontWeight:700}}>
            OFFLINE  {showReason ? '(hide)' : '(tap for error)'}
          </p>
          {showReason && (
            <>
              <p style={{color:'#FF7043',fontSize:9,margin:'3px 0 0',
                wordBreak:'break-all',lineHeight:1.4}}>{guestReason}</p>
              <button onClick={e=>{e.stopPropagation();refetch();}}
                style={{marginTop:4,background:'rgba(255,152,0,0.2)',border:'1px solid #FFA726',
                  color:'#FFA726',borderRadius:4,padding:'2px 12px',fontSize:9,cursor:'pointer'}}>
                Retry
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Top bar: pushed down with padding-top ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'28px 20px 8px',position:'relative',zIndex:10}}>
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

      {/* Balance */}
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
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════
# FIX 3 — Leaderboard: read directly from Firestore client SDK
# ══════════════════════════════════════════════════════════════
w("src/hooks/useLeaderboard.ts", """import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LeaderboardEntry, LeaderboardFilter } from '@/models/types';

interface UseLeaderboardReturn {
  entries:   LeaderboardEntry[];
  isLoading: boolean;
  error:     string | null;
  filter:    LeaderboardFilter;
  setFilter: (f: LeaderboardFilter) => void;
  updatedAt: number | null;
  refetch:   () => void;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [entries,   setEntries]   = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [filter,    setFilter]    = useState<LeaderboardFilter>('all-time');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [tick,      setTick]      = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const field = filter === 'daily' ? 'dailyEarned' : 'totalEarned';

    const q = query(
      collection(db, 'users'),
      orderBy(field, 'desc'),
      limit(100)
    );

    getDocs(q)
      .then(snap => {
        if (cancelled) return;
        const list: LeaderboardEntry[] = snap.docs.map((doc, i) => {
          const d = doc.data();
          return {
            rank:        i + 1,
            telegramId:  doc.id,
            username:    d.username    ?? '',
            firstName:   d.firstName   ?? 'Player',
            photoUrl:    d.photoUrl,
            totalEarned: d.totalEarned ?? 0,
            dailyEarned: d.dailyEarned ?? 0,
          };
        });
        setEntries(list);
        setUpdatedAt(Date.now());
      })
      .catch(err => {
        if (!cancelled) setError('Could not load leaderboard: ' + err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [filter, tick]);

  return { entries, isLoading, error, filter, setFilter, updatedAt, refetch };
}
""")

# ── Push
print("\nPushing all 3 fixes...")
run("git add -A")
run('git commit -m "fix: RBAC admin per role, lower top bar, leaderboard via Firestore"')
code = run("git push origin main")
if code == 0:
    print("\nDone! Deploying in ~60s.")
else:
    print("\nPush failed. Run: git push origin main")
