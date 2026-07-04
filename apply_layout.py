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

w("src/components/PageLayout.tsx", """import { ReactNode } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import Navigation from '@/components/Navigation/Navigation';

interface PageLayoutProps {
  children:    ReactNode;
  title?:      string;
  subtitle?:   string;
  showWallet?: boolean;
}

export default function PageLayout({ children, title, subtitle, showWallet = false }: PageLayoutProps) {
  const { userProfile } = useTelegramUser();
  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column',height:'100%',
      background:'radial-gradient(ellipse 80% 50% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        paddingTop:'max(48px,calc(env(safe-area-inset-top,0px) + 48px))',
        paddingLeft:20,paddingRight:20,paddingBottom:8,flexShrink:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,lineHeight:1,margin:0}}>
              {userProfile?.firstName ?? 'Player'}
            </p>
            <p style={{color:'#5A6A79',fontSize:10,margin:0}}>Lv {userProfile?.tapLevel ?? 1}</p>
          </div>
        </div>
        {showWallet && <TonConnectButton/>}
      </div>

      {(title || subtitle) && (
        <div style={{padding:'0 20px 12px',flexShrink:0}}>
          {title && <h2 style={{fontSize:20,fontWeight:900,margin:'0 0 2px',
            background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{title}</h2>}
          {subtitle && <p style={{color:'#5A6A79',fontSize:12,margin:0}}>{subtitle}</p>}
        </div>
      )}

      <div style={{flex:1,overflowY:'auto',overflowX:'hidden',paddingBottom:80,
        WebkitOverflowScrolling:'touch'}}>
        {children}
      </div>

      <Navigation/>
    </div>
  );
}
""")

w("src/components/Leaderboard/Leaderboard.tsx", """import { useLeaderboard } from '@/hooks/useLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import type { LeaderboardEntry } from '@/models/types';

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{fontSize:20,filter:'drop-shadow(0 0 6px rgba(255,215,0,0.6))'}}>🥇</span>;
  if (rank === 2) return <span style={{fontSize:20,filter:'drop-shadow(0 0 6px rgba(192,192,192,0.5))'}}>🥈</span>;
  if (rank === 3) return <span style={{fontSize:20,filter:'drop-shadow(0 0 6px rgba(205,127,50,0.5))'}}>🥉</span>;
  return <span style={{color:'#5A6A79',fontSize:12,fontWeight:700,width:22,textAlign:'center',display:'inline-block'}}>{rank}</span>;
}

function PlayerRow({ entry, index, myId }: { entry: LeaderboardEntry; index: number; myId?: string }) {
  const isMe = entry.telegramId === myId;
  return (
    <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:index*0.03}}
      style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',marginBottom:8,
        borderRadius:14,
        background: isMe
          ? 'linear-gradient(135deg,rgba(79,195,247,0.08),rgba(17,17,19,0.95))'
          : 'linear-gradient(145deg,#1A1A1D,#111113)',
        border:`1px solid ${isMe ? 'rgba(79,195,247,0.3)' : 'rgba(255,255,255,0.05)'}`,
      }}>
      <div style={{width:28,display:'flex',justifyContent:'center',flexShrink:0}}>
        <Medal rank={entry.rank}/>
      </div>
      <div style={{width:38,height:38,borderRadius:10,flexShrink:0,
        display:'flex',alignItems:'center',justifyContent:'center',
        background:'linear-gradient(135deg,#1A1A1D,#2A2A2D)',
        border:'1px solid rgba(192,192,192,0.1)',
        fontSize:15,fontWeight:700,color:'#9A9A9A'}}>
        {(entry.firstName?.[0] ?? entry.username?.[0] ?? '?').toUpperCase()}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{color:isMe?'#4FC3F7':'#D0D0D0',fontSize:13,fontWeight:700,
          margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {entry.firstName || entry.username || 'Player'}{isMe ? ' (you)' : ''}
        </p>
        {entry.username && <p style={{color:'#5A6A79',fontSize:10,margin:0}}>@{entry.username}</p>}
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <p style={{fontSize:14,fontWeight:900,margin:'0 0 2px',
          background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {entry.totalEarned.toLocaleString()}
        </p>
        <p style={{color:'#5A6A79',fontSize:9,margin:0}}>BB coins</p>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { entries, isLoading, error, filter, setFilter, updatedAt } = useLeaderboard();
  const { userProfile } = useTelegramUser();

  return (
    <div style={{padding:'0 16px'}}>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        {(['all-time','daily'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{padding:'7px 18px',borderRadius:20,fontSize:12,fontWeight:700,
              cursor:'pointer',border:'none',transition:'all 0.15s',
              background: filter===f ? 'linear-gradient(180deg,#D0D0D0,#9A9A9A)' : 'rgba(26,26,29,0.8)',
              color: filter===f ? '#111' : '#5A6A79',
              boxShadow: filter===f ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'}}>
            {f === 'all-time' ? 'All Time' : 'Today'}
          </button>
        ))}
        {updatedAt && <p style={{color:'#3A3A45',fontSize:10,margin:'0 0 0 auto'}}>
          {new Date(updatedAt).toLocaleTimeString()}
        </p>}
      </div>

      {isLoading ? (
        Array.from({length:8}).map((_,i) => (
          <div key={i} style={{height:62,borderRadius:14,marginBottom:8,
            background:'rgba(26,26,29,0.6)',opacity:1-i*0.1}}/>
        ))
      ) : error ? (
        <p style={{color:'#5A6A79',fontSize:13,textAlign:'center',padding:'40px 0'}}>{error}</p>
      ) : entries.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0'}}>
          <p style={{fontSize:32,margin:'0 0 12px'}}>🏆</p>
          <p style={{color:'#5A6A79',fontSize:14,margin:0}}>No players yet — start tapping!</p>
        </div>
      ) : (
        <AnimatePresence>
          {entries.map((e,i) => <PlayerRow key={e.telegramId} entry={e} index={i} myId={userProfile?.telegramId}/>)}
        </AnimatePresence>
      )}
    </div>
  );
}
""")

w("src/pages/Staking.tsx", """import { useState } from 'react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import PageLayout from '@/components/PageLayout';
import StakingPageComponent from '@/components/Staking/StakingPage';

export default function StakingRoute() {
  const { userProfile, isLoading } = useTelegramUser();
  const [balance, setBalance] = useState<number | null>(null);
  return (
    <PageLayout title="Pre-Launch Staking" subtitle="Lock coins before TGE to earn yields" showWallet>
      {isLoading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}>
          <div style={{width:28,height:28,border:'2px solid #9A9A9A',borderTopColor:'transparent',
            borderRadius:'50%',animation:'bb-spin 0.8s linear infinite'}}/>
          <style>{'@keyframes bb-spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      ) : (
        <StakingPageComponent
          telegramId={userProfile?.telegramId ?? ''}
          balance={balance ?? userProfile?.balance ?? 0}
          onStaked={setBalance}
        />
      )}
    </PageLayout>
  );
}
""")

w("src/pages/WalletPage.tsx", """import { useState } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { useTasks } from '@/hooks/useTasks';
import PageLayout from '@/components/PageLayout';

export default function WalletPage() {
  const { userProfile } = useTelegramUser();
  const address   = useTonAddress();
  const { tasks, completed, completeTask } = useTasks(userProfile?.telegramId ?? 'guest');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed,  setClaimed]  = useState<Set<string>>(new Set());

  const handleTask = async (task: typeof tasks[0]) => {
    if (task.status === 'locked' || completed.has(task.id) || claimed.has(task.id) || claiming) return;
    if (task.link) window.open(task.link, '_blank');
    setClaiming(task.id);
    const ok = await completeTask(task);
    if (ok) setClaimed(prev => new Set([...prev, task.id]));
    setClaiming(null);
  };

  const slots = [...tasks, ...Array(Math.max(0, 3 - tasks.length)).fill(null)].slice(0, Math.max(3, tasks.length));

  return (
    <PageLayout title="Wallet & Tasks" subtitle="Connect TON wallet and complete tasks">
      <div style={{padding:'0 16px'}}>

        <div style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
          border:'1px solid rgba(192,192,192,0.1)',borderRadius:16,padding:20,marginBottom:24}}>
          <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
            letterSpacing:'0.1em',margin:'0 0 14px',fontWeight:700}}>TON Wallet</p>
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
            <TonConnectButton/>
          </div>
          {address ? (
            <div style={{background:'rgba(79,195,247,0.06)',border:'1px solid rgba(79,195,247,0.15)',
              borderRadius:10,padding:'8px 12px'}}>
              <p style={{color:'#4FC3F7',fontSize:10,margin:'0 0 2px',fontWeight:700}}>CONNECTED</p>
              <p style={{color:'#7A8A99',fontSize:10,margin:0,wordBreak:'break-all',fontFamily:'monospace'}}>{address}</p>
            </div>
          ) : (
            <p style={{color:'#3A3A45',fontSize:11,textAlign:'center',margin:0}}>
              Connect to link staking rewards and receive future airdrops
            </p>
          )}
        </div>

        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
          letterSpacing:'0.1em',margin:'0 0 12px',fontWeight:700}}>Tasks</p>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {slots.map((task, i) => {
            if (!task) return (
              <div key={'empty-'+i} style={{background:'rgba(17,17,19,0.5)',
                border:'1px dashed rgba(255,255,255,0.05)',borderRadius:16,
                padding:'18px 20px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:'#0A0A0D',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,opacity:0.3}}>🔒</div>
                <div>
                  <p style={{color:'#2A2A2D',fontSize:13,fontWeight:700,margin:'0 0 3px'}}>No task yet</p>
                  <p style={{color:'#1A1A1D',fontSize:11,margin:0}}>Developer will post soon</p>
                </div>
              </div>
            );
            const isLocked  = task.status === 'locked';
            const isDone    = completed.has(task.id) || claimed.has(task.id);
            const isLoading = claiming === task.id;
            return (
              <button key={task.id} onClick={() => handleTask(task)}
                disabled={isLocked || isDone || !!claiming}
                style={{width:'100%',textAlign:'left',
                  cursor: isLocked || isDone ? 'default' : 'pointer',
                  background: isDone ? 'linear-gradient(145deg,rgba(165,214,167,0.07),rgba(17,17,19,0.95))'
                    : isLocked ? 'rgba(17,17,19,0.5)'
                    : 'linear-gradient(145deg,rgba(79,195,247,0.06),rgba(17,17,19,0.98))',
                  border:`1px solid ${isDone ? 'rgba(165,214,167,0.25)' : isLocked ? 'rgba(255,255,255,0.04)' : 'rgba(79,195,247,0.18)'}`,
                  borderRadius:16,padding:'16px 18px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
                  background: isDone ? 'rgba(165,214,167,0.1)' : isLocked ? 'rgba(26,26,29,0.8)' : 'rgba(79,195,247,0.08)',
                  filter: isLocked ? 'grayscale(1) brightness(0.4)' : 'none'}}>
                  {isDone ? '\u2705' : isLocked ? '\uD83D\uDD12' : task.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color: isDone?'#A5D6A7':isLocked?'#2A2A2D':'#D0D0D0',
                    fontSize:13,fontWeight:700,margin:'0 0 3px',
                    filter:isLocked?'blur(5px)':'none',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {isLocked ? '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588' : task.title}
                  </p>
                  <p style={{color:'#5A6A79',fontSize:11,margin:0}}>
                    {isDone ? 'Completed \u2713' : isLocked ? 'Locked' : task.description}
                  </p>
                </div>
                {!isLocked && (
                  <div style={{flexShrink:0,textAlign:'right'}}>
                    <p style={{fontSize:15,fontWeight:900,margin:'0 0 2px',
                      color:isDone?'#A5D6A7':'#FFD700'}}>+{task.reward.toLocaleString()}</p>
                    <p style={{color:'#3A3A45',fontSize:9,margin:0}}>
                      {isLoading ? 'claiming...' : 'BB'}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p style={{color:'#2A2A2D',fontSize:10,textAlign:'center',marginTop:20}}>
          Complete tasks to earn BB coins
        </p>
      </div>
    </PageLayout>
  );
}
""")

w("src/App.tsx", """import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import SplashScreen  from '@/components/SplashScreen/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home          from '@/pages/Home';
import StakingRoute  from '@/pages/Staking';
import AdminPage     from '@/pages/admin/AdminPage';
import WalletPage    from '@/pages/WalletPage';
import Leaderboard   from '@/components/Leaderboard/Leaderboard';
import PageLayout    from '@/components/PageLayout';
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
            <SplashScreen onComplete={() => setSplashDone(true)}/>
          ) : (
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  <Route path="/"            element={<Home/>}/>
                  <Route path="/leaderboard" element={
                    <PageLayout title="Leaderboard" subtitle="Global BB coin rankings">
                      <Leaderboard/>
                    </PageLayout>
                  }/>
                  <Route path="/staking"     element={<StakingRoute/>}/>
                  <Route path="/wallet"      element={<WalletPage/>}/>
                  <Route path={ADMIN_ROUTE}  element={<AdminPage/>}/>
                  <Route path="*"            element={<Navigate to="/" replace/>}/>
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

print("\nAll files written. Pushing...")
run("git add -A")
run('git commit -m "feat: unified PageLayout on all pages, improved leaderboard"')
code = run("git push origin main")
print("Done!" if code == 0 else "Run: git push origin main")
