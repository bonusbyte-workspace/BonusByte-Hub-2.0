
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

# ══════════════════════════════════════════════════════════════════════
# 1. HOME: much lower top section using safe-area + extra padding
# ══════════════════════════════════════════════════════════════════════
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showReason, setShowReason] = useState(false);

  const onSpawn = useCallback((p: Particle) => setParticles(prev => [...prev.slice(-30), p]), []);
  const onEnd   = useCallback((id: string) => setParticles(prev => prev.filter(p => p.id !== id)), []);

  const { balance, energy, tapCount, handleTap, isSyncing } = useTapEngine({
    telegramId:      userProfile?.telegramId ?? 'guest',
    initialBalance:  userProfile?.balance ?? 0,
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

      {isGuestMode && (
        <div onClick={() => setShowReason(r => !r)}
          style={{background:'rgba(255,152,0,0.12)',borderBottom:'1px solid rgba(255,152,0,0.3)',
            padding:'5px 16px',textAlign:'center',zIndex:20,cursor:'pointer',position:'relative'}}>
          <p style={{color:'#FFA726',fontSize:10,margin:0,fontWeight:700}}>
            OFFLINE {showReason ? '(hide)' : '(tap for error)'}
          </p>
          {showReason && (<>
            <p style={{color:'#FF7043',fontSize:9,margin:'3px 0 0',wordBreak:'break-all',lineHeight:1.4}}>{guestReason}</p>
            <button onClick={e=>{e.stopPropagation();refetch();}}
              style={{marginTop:4,background:'rgba(255,152,0,0.2)',border:'1px solid #FFA726',
                color:'#FFA726',borderRadius:4,padding:'2px 12px',fontSize:9,cursor:'pointer'}}>
              Retry
            </button>
          </>)}
        </div>
      )}

      {/* Top bar — padded down past Telegram header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        paddingTop:'max(48px, calc(env(safe-area-inset-top, 0px) + 48px))',
        paddingLeft:20,paddingRight:20,paddingBottom:8,position:'relative',zIndex:10}}>
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
            <div style={{width:14,height:14,border:'1.5px solid #4FC3F7',borderTopColor:'transparent',
              borderRadius:'50%',animation:'bb-spin 0.8s linear infinite'}}/>
          )}
          <TonConnectButton/>
        </div>
      </div>

      <div style={{textAlign:'center',padding:'4px 20px 12px',position:'relative',zIndex:10}}>
        <p style={{color:'#5A6A79',fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 4px'}}>Balance</p>
        <h1 style={{fontSize:'clamp(2rem,8vw,3rem)',fontWeight:900,letterSpacing:'-0.02em',lineHeight:1,margin:'0 0 4px',
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
""")

# ══════════════════════════════════════════════════════════════════════
# 2a. useTasks hook
# ══════════════════════════════════════════════════════════════════════
w("src/hooks/useTasks.ts", """import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Task {
  id:          string;
  title:       string;
  description: string;
  reward:      number;
  status:      'locked' | 'active';
  type:        string;
  link?:       string;
  icon:        string;
  createdAt:   number;
}

export function useTasks(telegramId: string) {
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Live tasks from Firestore
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return unsub;
  }, []);

  // User's completed tasks
  useEffect(() => {
    if (!telegramId || telegramId === 'guest') return;
    const q = collection(db, 'users', telegramId, 'completedTasks');
    const unsub = onSnapshot(q, snap => {
      setCompleted(new Set(snap.docs.map(d => d.id)));
    });
    return unsub;
  }, [telegramId]);

  const completeTask = async (task: Task, balance: number) => {
    if (!telegramId || telegramId === 'guest') return false;
    if (completed.has(task.id)) return false;
    try {
      // Mark task completed
      await setDoc(doc(db, 'users', telegramId, 'completedTasks', task.id), {
        completedAt: Date.now(),
        reward:      task.reward,
        serverTimestamp: serverTimestamp(),
      });
      // Add reward to balance
      const userRef  = doc(db, 'users', telegramId);
      const snap     = await getDoc(userRef);
      if (snap.exists()) {
        const cur = snap.data().balance ?? 0;
        await setDoc(userRef, { balance: cur + task.reward, totalEarned: (snap.data().totalEarned ?? 0) + task.reward }, { merge: true });
      }
      return true;
    } catch { return false; }
  };

  return { tasks, completed, isLoading, completeTask };
}
""")

# ══════════════════════════════════════════════════════════════════════
# 2b. WalletPage with task buttons
# ══════════════════════════════════════════════════════════════════════
w("src/pages/WalletPage.tsx", """import { useState } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { useTasks } from '@/hooks/useTasks';
import Navigation from '@/components/Navigation/Navigation';

export default function WalletPage() {
  const { userProfile } = useTelegramUser();
  const address = useTonAddress();
  const { tasks, completed, completeTask } = useTasks(userProfile?.telegramId ?? 'guest');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed,  setClaimed]  = useState<Set<string>>(new Set());

  const handleTask = async (task: typeof tasks[0]) => {
    if (task.status === 'locked' || completed.has(task.id) || claiming) return;
    if (task.link) window.open(task.link, '_blank');
    setClaiming(task.id);
    const ok = await completeTask(task, userProfile?.balance ?? 0);
    if (ok) setClaimed(prev => new Set([...prev, task.id]));
    setClaiming(null);
  };

  // Always show exactly 3 slots
  const slots = [...tasks, ...Array(Math.max(0, 3 - tasks.length)).fill(null)].slice(0, Math.max(3, tasks.length));

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',
      background:'radial-gradient(ellipse 80% 40% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>

      <div style={{flex:1,overflowY:'auto',padding:'max(48px,calc(env(safe-area-inset-top,0px)+48px)) 20px 16px'}}>

        {/* TON Wallet */}
        <div style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
          border:'1px solid rgba(192,192,192,0.12)',borderRadius:16,padding:20,marginBottom:24}}>
          <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
            letterSpacing:'0.1em',margin:'0 0 12px'}}>TON Wallet</p>
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
            <TonConnectButton/>
          </div>
          {address && (
            <p style={{color:'#4FC3F7',fontSize:11,textAlign:'center',margin:0,
              wordBreak:'break-all',fontFamily:'monospace'}}>{address}</p>
          )}
          {!address && (
            <p style={{color:'#3A3A45',fontSize:11,textAlign:'center',margin:0}}>
              Connect to link staking rewards and receive airdrops
            </p>
          )}
        </div>

        {/* Tasks */}
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
          letterSpacing:'0.1em',margin:'0 0 12px'}}>Tasks</p>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {slots.map((task, i) => {
            if (!task) return (
              <div key={'empty-' + i} style={{
                background:'rgba(26,26,29,0.4)',
                border:'1px dashed rgba(255,255,255,0.06)',
                borderRadius:14,padding:'18px 20px',
                display:'flex',alignItems:'center',gap:14,opacity:0.4}}>
                <div style={{width:40,height:40,borderRadius:10,
                  background:'#111',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:18}}>🔒</span>
                </div>
                <div>
                  <p style={{color:'#3A3A45',fontSize:13,fontWeight:700,margin:'0 0 2px'}}>No task yet</p>
                  <p style={{color:'#2A2A35',fontSize:11,margin:0}}>Developer will post soon</p>
                </div>
              </div>
            );

            const isLocked    = task.status === 'locked';
            const isDone      = completed.has(task.id) || claimed.has(task.id);
            const isLoading   = claiming === task.id;

            return (
              <button key={task.id} onClick={() => handleTask(task)} disabled={isLocked || isDone || !!claiming}
                style={{
                  width:'100%',textAlign:'left',cursor: isLocked || isDone ? 'default' : 'pointer',
                  background: isDone
                    ? 'linear-gradient(145deg,rgba(165,214,167,0.08),rgba(17,17,19,0.95))'
                    : isLocked
                    ? 'rgba(26,26,29,0.5)'
                    : 'linear-gradient(145deg,rgba(79,195,247,0.06),rgba(17,17,19,0.98))',
                  border: `1px solid ${isDone ? 'rgba(165,214,167,0.3)' : isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(79,195,247,0.2)'}`,
                  borderRadius:14,padding:'16px 20px',
                  display:'flex',alignItems:'center',gap:14,
                  transition:'all 0.2s ease',
                }}>
                <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
                  background: isDone ? 'rgba(165,214,167,0.12)' : isLocked ? 'rgba(42,42,45,0.8)' : 'rgba(79,195,247,0.1)',
                  filter: isLocked ? 'grayscale(1) brightness(0.5)' : 'none'}}>
                  {isDone ? '✅' : isLocked ? '🔒' : task.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color: isLocked ? '#3A3A45' : '#D0D0D0',
                    fontSize:13,fontWeight:700,margin:'0 0 2px',
                    filter: isLocked ? 'blur(4px)' : 'none'}}>
                    {isLocked ? '••••••••••' : task.title}
                  </p>
                  <p style={{color:'#5A6A79',fontSize:11,margin:0}}>
                    {isLocked ? 'Locked' : isDone ? 'Completed ✓' : task.description}
                  </p>
                </div>
                <div style={{flexShrink:0,textAlign:'right'}}>
                  {!isLocked && (
                    <p style={{
                      color: isDone ? '#A5D6A7' : '#FFD700',
                      fontSize:14,fontWeight:900,margin:'0 0 2px',
                      textShadow: isDone ? '0 0 8px rgba(165,214,167,0.4)' : '0 0 8px rgba(255,215,0,0.3)'}}>
                      +{task.reward.toLocaleString()}
                    </p>
                  )}
                  <p style={{color:'#3A3A45',fontSize:9,margin:0}}>BB</p>
                  {isLoading && <p style={{color:'#4FC3F7',fontSize:9,margin:'2px 0 0'}}>claiming...</p>}
                </div>
              </button>
            );
          })}
        </div>

        <p style={{color:'#2A2A2D',fontSize:10,textAlign:'center',marginTop:20}}>
          Complete tasks to earn BB coins · New tasks added by the team
        </p>
      </div>
      <Navigation/>
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════════════
# 3. Staking page with TON wallet receive address
# ══════════════════════════════════════════════════════════════════════
w("src/components/Staking/StakingPage.tsx", """import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { STAKE_PERIODS } from '@/models/types';
import type { LockDays } from '@/models/types';

interface Props {
  telegramId: string;
  balance:    number;
  onStaked:   (newBalance: number) => void;
}

const COLORS: Record<number, { border: string; text: string; glow: string }> = {
  7:  { border:'rgba(205,127,50,0.45)',  text:'#CD7F32', glow:'rgba(205,127,50,0.2)' },
  30: { border:'rgba(192,192,192,0.45)', text:'#C0C0C0', glow:'rgba(192,192,192,0.15)' },
  90: { border:'rgba(212,175,55,0.55)',  text:'#D4AF37', glow:'rgba(212,175,55,0.25)' },
};

export default function StakingPage({ telegramId, balance, onStaked }: Props) {
  const [selectedDays, setSelectedDays] = useState<LockDays>(30);
  const [amount,       setAmount]       = useState('');
  const [isStaking,    setIsStaking]    = useState(false);
  const [message,      setMessage]      = useState<{type:'success'|'error',text:string}|null>(null);
  const [receiveWallet, setReceiveWallet] = useState<string>('');
  const [tonConnectUI]  = useTonConnectUI();
  const userWallet      = useTonAddress();

  // Load developer's TON receive wallet from Firestore
  useEffect(() => {
    getDoc(doc(db, 'config', 'economy')).then(snap => {
      if (snap.exists() && snap.data().stakingWallet) {
        setReceiveWallet(snap.data().stakingWallet as string);
      }
    }).catch(() => {});
  }, []);

  const selected  = STAKE_PERIODS.find(p => p.days === selectedDays)!;
  const amountNum = parseFloat(amount) || 0;
  const yieldAmt  = amountNum * (selected.apy / 100) * (selectedDays / 365);
  const isValid   = amountNum > 0 && amountNum <= balance;

  const handleStake = useCallback(async () => {
    if (!isValid || isStaking) return;
    setIsStaking(true);
    setMessage(null);

    try {
      // Deduct BB coins from Firestore
      const userRef = doc(db, 'users', telegramId);
      const snap    = await getDoc(userRef);
      if (!snap.exists()) throw new Error('User not found');
      const cur = snap.data().balance ?? 0;
      if (cur < amountNum) throw new Error('Insufficient balance');
      const newBalance = cur - amountNum;

      // Record stake
      const stakeRef = doc(db, 'users', telegramId, 'stakes', Date.now().toString());
      await setDoc(stakeRef, {
        amount:     amountNum,
        lockDays:   selectedDays,
        apy:        selected.apy,
        stakedAt:   Date.now(),
        unlockAt:   Date.now() + selectedDays * 86400000,
        status:     'active',
        projectedYield: yieldAmt,
        walletAddress: userWallet || null,
        serverTimestamp: serverTimestamp(),
      });

      // Update user balance
      await setDoc(userRef, { balance: newBalance }, { merge: true });
      onStaked(newBalance);
      setAmount('');

      // If TON wallet connected and receive wallet set, send TON
      if (userWallet && receiveWallet) {
        try {
          const tonAmount = Math.round(amountNum * 0.001 * 1e9); // 0.001 TON per BB coin
          if (tonAmount >= 10000000) { // min 0.01 TON
            await tonConnectUI.sendTransaction({
              validUntil: Math.floor(Date.now() / 1000) + 600,
              messages: [{
                address: receiveWallet,
                amount:  tonAmount.toString(),
                payload: btoa('BonusByte Stake ' + selectedDays + 'd'),
              }],
            });
            setMessage({ type: 'success', text: 'Staked! TON sent to staking pool. Unlocks in ' + selectedDays + ' days.' });
          } else {
            setMessage({ type: 'success', text: 'BB coins staked! Connect TON wallet for full staking benefits. Unlocks in ' + selectedDays + ' days.' });
          }
        } catch {
          setMessage({ type: 'success', text: 'BB coins staked successfully! Unlocks in ' + selectedDays + ' days.' });
        }
      } else {
        setMessage({ type: 'success', text: 'Staked! Connect TON wallet to send TON to the staking pool.' });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Staking failed.' });
    } finally {
      setIsStaking(false);
    }
  }, [isValid, isStaking, telegramId, amountNum, selectedDays, selected.apy, yieldAmt, userWallet, receiveWallet, onStaked, tonConnectUI]);

  return (
    <div style={{flex:1,overflowY:'auto',padding:'max(48px,calc(env(safe-area-inset-top,0px)+48px)) 16px 100px'}}>

      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:900,margin:'0 0 4px',
          background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Pre-Launch Staking
        </h2>
        <p style={{color:'#5A6A79',fontSize:12,margin:0}}>
          Lock coins before TGE to earn guaranteed yields
        </p>
      </div>

      {/* Balance */}
      <div style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
        border:'1px solid rgba(192,192,192,0.1)',borderRadius:14,padding:16,marginBottom:16}}>
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 4px'}}>
          Available Balance
        </p>
        <p style={{fontSize:22,fontWeight:900,margin:0,
          background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {balance.toLocaleString()} BB
        </p>
      </div>

      {/* Receive wallet notice */}
      {receiveWallet && (
        <div style={{background:'rgba(79,195,247,0.06)',border:'1px solid rgba(79,195,247,0.2)',
          borderRadius:12,padding:'10px 14px',marginBottom:16}}>
          <p style={{color:'#4FC3F7',fontSize:10,margin:'0 0 2px',fontWeight:700}}>
            STAKING POOL WALLET
          </p>
          <p style={{color:'#7A8A99',fontSize:10,margin:0,wordBreak:'break-all',fontFamily:'monospace'}}>
            {receiveWallet}
          </p>
        </div>
      )}

      {/* Period selector */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
        {STAKE_PERIODS.map(period => {
          const c      = COLORS[period.days];
          const active = period.days === selectedDays;
          return (
            <motion.button key={period.days} whileTap={{scale:0.96}}
              onClick={() => setSelectedDays(period.days)}
              style={{
                background: active ? 'linear-gradient(145deg,rgba(79,195,247,0.05),rgba(17,17,19,0.98))' : 'rgba(17,17,19,0.9)',
                border:`1px solid ${active ? c.border : 'rgba(255,255,255,0.07)'}`,
                borderRadius:12,padding:12,textAlign:'center',cursor:'pointer',
                boxShadow: active ? `0 0 16px ${c.glow}` : 'none',
              }}>
              <p style={{color:c.text,fontSize:10,fontWeight:700,margin:'0 0 2px'}}>{period.badge}</p>
              <p style={{color:'#E8E8E8',fontSize:18,fontWeight:900,lineHeight:1,margin:'0 0 2px'}}>{period.days}d</p>
              <p style={{color:c.text,fontSize:11,fontWeight:700,margin:0}}>{period.apy}% APY</p>
            </motion.button>
          );
        })}
      </div>

      {/* Amount input */}
      <div style={{marginBottom:16}}>
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 8px'}}>
          Amount to Stake
        </p>
        <div style={{display:'flex',gap:8}}>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0" min="1" max={balance}
            style={{flex:1,background:'#111113',border:'1px solid #2A2A2D',borderRadius:12,
              padding:'12px 16px',color:'#E8E8E8',fontSize:18,fontWeight:700,outline:'none',
              WebkitUserSelect:'auto',touchAction:'auto'}}/>
          <button onClick={() => setAmount(String(Math.floor(balance)))}
            style={{background:'linear-gradient(180deg,#D0D0D0,#9A9A9A)',
              border:'1px solid rgba(200,200,200,0.3)',borderRadius:12,
              padding:'0 16px',fontWeight:700,fontSize:13,cursor:'pointer',color:'#111'}}>
            MAX
          </button>
        </div>
      </div>

      {/* Yield preview */}
      {amountNum > 0 && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
            border:'1px solid rgba(192,192,192,0.1)',borderRadius:14,padding:16,marginBottom:16}}>
          <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>
            Projected Returns
          </p>
          {[
            { label:'Staked',    value: amountNum.toLocaleString() + ' BB', color:'#E8E8E8' },
            { label:`Yield (${selected.apy}% APY)`, value:'+' + yieldAmt.toFixed(2) + ' BB', color:COLORS[selectedDays].text },
            { label:'Total return', value:(amountNum + yieldAmt).toFixed(2) + ' BB', color:'#E8E8E8' },
          ].map(row => (
            <div key={row.label} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{color:'#5A6A79',fontSize:12}}>{row.label}</span>
              <span style={{color:row.color,fontSize:12,fontWeight:700}}>{row.value}</span>
            </div>
          ))}
          <div style={{height:1,background:'#1A1A1D',margin:'8px 0'}}/>
          <p style={{color:'#3A3A45',fontSize:10,textAlign:'center',margin:0}}>
            Unlocks after {selectedDays} days · TGE rewards distributed to wallet
          </p>
        </motion.div>
      )}

      {/* TON wallet prompt */}
      {!userWallet && (
        <div style={{background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.2)',
          borderRadius:12,padding:'10px 14px',marginBottom:16,textAlign:'center'}}>
          <p style={{color:'#D4AF37',fontSize:11,margin:'0 0 8px',fontWeight:600}}>
            Connect TON Wallet to send TON to staking pool
          </p>
          <div style={{display:'flex',justifyContent:'center'}}>
            <TonConnectButton/>
          </div>
        </div>
      )}

      {/* Stake button */}
      <motion.button whileTap={isValid ? {scale:0.97} : {}}
        onClick={handleStake} disabled={!isValid || isStaking}
        style={{
          width:'100%',padding:'16px',borderRadius:14,fontWeight:900,fontSize:16,cursor:'pointer',
          background: isValid
            ? 'linear-gradient(180deg,#D0D0D0 0%,#9A9A9A 40%,#7A7A7A 60%,#B8B8B8 100%)'
            : 'rgba(42,42,45,0.8)',
          border:`1px solid ${isValid ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.05)'}`,
          color: isValid ? '#111' : '#5A6A79',
        }}>
        {isStaking ? 'Staking...' : `Stake for ${selectedDays} Days`}
      </motion.button>

      <AnimatePresence>
        {message && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{marginTop:12,padding:'12px 16px',borderRadius:12,textAlign:'center',fontSize:12,fontWeight:600,
              background: message.type === 'success' ? 'rgba(165,214,167,0.1)' : 'rgba(239,83,80,0.1)',
              border:`1px solid ${message.type === 'success' ? 'rgba(165,214,167,0.3)' : 'rgba(239,83,80,0.3)'}`,
              color: message.type === 'success' ? '#A5D6A7' : '#EF9A9A'}}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════════════
# 4. EconomyModule: real Firestore data + task manager + wallet config
# ══════════════════════════════════════════════════════════════════════
w("src/components/admin/modules/EconomyModule.tsx", """import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy, getDocs,
  doc, setDoc, addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Task {
  id:          string;
  title:       string;
  description: string;
  reward:      number;
  status:      'locked' | 'active';
  icon:        string;
  link?:       string;
  createdAt:   number;
}

export default function EconomyModule() {
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [stakingWallet, setStakingWallet] = useState('');
  const [savedWallet,   setSavedWallet]   = useState('');
  const [totalUsers,    setTotalUsers]    = useState(0);
  const [totalStaked,   setTotalStaked]   = useState(0);
  const [saved,         setSaved]         = useState(false);
  const [newTask,       setNewTask]       = useState({ title:'', description:'', reward:0, icon:'🎯', link:'' });

  // Load config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'economy'), snap => {
      if (snap.exists()) {
        setStakingWallet(snap.data().stakingWallet ?? '');
        setSavedWallet(snap.data().stakingWallet ?? '');
      }
    });
    return unsub;
  }, []);

  // Live tasks
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    return unsub;
  }, []);

  // Stats
  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setTotalUsers(snap.size);
      let staked = 0;
      snap.docs.forEach(d => { staked += d.data().totalStaked ?? 0; });
      setTotalStaked(staked);
    });
  }, []);

  const saveWallet = async () => {
    await setDoc(doc(db, 'config', 'economy'), { stakingWallet, updatedAt: serverTimestamp() }, { merge: true });
    setSavedWallet(stakingWallet);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.reward) return;
    await addDoc(collection(db, 'tasks'), {
      ...newTask,
      reward:    Number(newTask.reward),
      status:    'locked',
      createdAt: Date.now(),
      serverTimestamp: serverTimestamp(),
    });
    setNewTask({ title:'', description:'', reward:0, icon:'🎯', link:'' });
  };

  const toggleTask = async (task: Task) => {
    await updateDoc(doc(db, 'tasks', task.id), {
      status: task.status === 'locked' ? 'active' : 'locked',
    });
  };

  const deleteTask = async (id: string) => {
    await updateDoc(doc(db, 'tasks', id), { status: 'locked' });
  };

  return (
    <div style={{padding:16,overflowY:'auto'}}>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {[
          { label:'Total Users',  value: totalUsers.toLocaleString(),  color:'#4FC3F7' },
          { label:'Total Staked', value: totalStaked.toLocaleString() + ' BB', color:'#D4AF37' },
        ].map(s => (
          <div key={s.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'12px 14px'}}>
            <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 4px'}}>{s.label}</p>
            <p style={{color:s.color,fontSize:20,fontWeight:900,margin:0}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TON Staking Wallet */}
      <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
        border:'1px solid rgba(79,195,247,0.2)',borderRadius:12,padding:16,marginBottom:20}}>
        <p style={{color:'#4FC3F7',fontSize:11,fontWeight:700,textTransform:'uppercase',
          letterSpacing:'0.08em',margin:'0 0 10px'}}>⚡ TON Staking Receive Wallet</p>
        <p style={{color:'#5A6A79',fontSize:10,margin:'0 0 8px'}}>
          Users will send TON to this address when staking
        </p>
        <input value={stakingWallet} onChange={e => setStakingWallet(e.target.value)}
          placeholder="EQ... or UQ... TON wallet address"
          style={{width:'100%',background:'#0A0A0D',border:'1px solid #2A2A2D',
            borderRadius:8,padding:'10px 12px',color:'#E8E8E8',fontSize:12,
            outline:'none',boxSizing:'border-box',fontFamily:'monospace',
            WebkitUserSelect:'auto',touchAction:'auto'}}/>
        <button onClick={saveWallet} style={{
          marginTop:8,width:'100%',padding:'10px',borderRadius:8,fontWeight:700,fontSize:12,
          background:'linear-gradient(180deg,#D0D0D0,#9A9A9A)',
          border:'1px solid rgba(200,200,200,0.3)',color:'#111',cursor:'pointer'}}>
          {saved ? '✓ Saved' : 'Save Wallet Address'}
        </button>
        {savedWallet && (
          <p style={{color:'#3A3A45',fontSize:9,margin:'6px 0 0',wordBreak:'break-all',fontFamily:'monospace'}}>
            Current: {savedWallet}
          </p>
        )}
      </div>

      {/* Task Manager */}
      <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',
        letterSpacing:'0.08em',margin:'0 0 10px'}}>Task Manager</p>

      {/* New task form */}
      <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
        border:'1px solid rgba(212,175,55,0.2)',borderRadius:12,padding:14,marginBottom:14}}>
        <p style={{color:'#D4AF37',fontSize:11,fontWeight:700,margin:'0 0 10px'}}>+ New Task</p>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            { key:'title',       placeholder:'Task title',       label:'Title' },
            { key:'description', placeholder:'What to do',       label:'Description' },
            { key:'link',        placeholder:'https://... (optional)', label:'Link' },
          ].map(f => (
            <input key={f.key} value={(newTask as Record<string,string|number>)[f.key] as string}
              onChange={e => setNewTask(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                padding:'8px 12px',color:'#E8E8E8',fontSize:12,outline:'none',
                WebkitUserSelect:'auto',touchAction:'auto'}}/>
          ))}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <input type="number" value={newTask.reward || ''} onChange={e => setNewTask(p => ({ ...p, reward: Number(e.target.value) }))}
              placeholder="Reward (BB)"
              style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                padding:'8px 12px',color:'#E8E8E8',fontSize:12,outline:'none',
                WebkitUserSelect:'auto',touchAction:'auto'}}/>
            <input value={newTask.icon} onChange={e => setNewTask(p => ({ ...p, icon: e.target.value }))}
              placeholder="Icon emoji"
              style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                padding:'8px 12px',color:'#E8E8E8',fontSize:16,outline:'none',textAlign:'center',
                WebkitUserSelect:'auto',touchAction:'auto'}}/>
          </div>
          <button onClick={addTask} disabled={!newTask.title || !newTask.reward}
            style={{padding:'10px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',
              background: newTask.title && newTask.reward ? 'linear-gradient(180deg,#D0D0D0,#9A9A9A)' : '#2A2A2D',
              border:'none',color: newTask.title && newTask.reward ? '#111' : '#5A6A79'}}>
            Add Task (Locked)
          </button>
        </div>
      </div>

      {/* Existing tasks */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {tasks.length === 0 && (
          <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'20px 0'}}>No tasks yet</p>
        )}
        {tasks.map(task => (
          <div key={task.id} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:`1px solid ${task.status === 'active' ? 'rgba(165,214,167,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius:10,padding:'12px 14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20}}>{task.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,margin:'0 0 2px',truncate:true}}>{task.title}</p>
                <p style={{color:'#5A6A79',fontSize:10,margin:0}}>{task.description}</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <p style={{color:'#FFD700',fontSize:13,fontWeight:900,margin:'0 0 4px'}}>+{task.reward} BB</p>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={() => toggleTask(task)}
                    style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',border:'none',
                      background: task.status === 'active' ? 'rgba(239,83,80,0.2)' : 'rgba(165,214,167,0.2)',
                      color: task.status === 'active' ? '#EF5350' : '#A5D6A7'}}>
                    {task.status === 'active' ? 'Lock' : 'Unlock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════════════
# 5. DeveloperModule: real Firestore data
# ══════════════════════════════════════════════════════════════════════
w("src/components/admin/modules/DeveloperModule.tsx", """import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Log { id: string; telegramId: string; reason: string; clicksReported: number; maxAllowed: number; timestamp: number; }

export default function DeveloperModule() {
  const [userCount,   setUserCount]   = useState(0);
  const [logs,        setLogs]        = useState<Log[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    // Total users
    getDocs(collection(db, 'users')).then(snap => {
      setUserCount(snap.size);
      const since = Date.now() - 86400000;
      setActiveUsers(snap.docs.filter(d => (d.data().lastSyncAt ?? 0) > since).length);
    });
    // Anti-cheat logs live
    const q = query(collection(db, 'antiCheatLogs'), orderBy('timestamp', 'desc'), limit(20));
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Log)));
    });
    return unsub;
  }, []);

  const metrics = [
    { label:'Total Users',    value: userCount,    color:'#4FC3F7' },
    { label:'Active (24h)',   value: activeUsers,  color:'#A5D6A7' },
    { label:'Cheat Blocks',   value: logs.length,  color:'#EF9A9A' },
  ];

  return (
    <div style={{padding:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20}}>
        {metrics.map(m => (
          <div key={m.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px'}}>
            <p style={{color:'#5A6A79',fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px'}}>{m.label}</p>
            <p style={{color:m.color,fontSize:20,fontWeight:900,margin:0}}>{m.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',
        letterSpacing:'0.08em',margin:'0 0 10px'}}>Anti-Cheat Log (live)</p>

      <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
        border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
        {logs.length === 0 && (
          <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'20px 0'}}>No violations</p>
        )}
        {logs.slice(0, 10).map(log => (
          <div key={log.id} style={{display:'flex',justifyContent:'space-between',
            padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
            <div>
              <p style={{color:'#C0C0C0',fontSize:11,fontWeight:600,margin:'0 0 2px'}}>
                {log.telegramId}
              </p>
              <p style={{color:'#5A6A79',fontSize:10,margin:0}}>{log.reason}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{color:'#EF5350',fontSize:11,fontWeight:700,margin:'0 0 2px'}}>
                {log.clicksReported} clicks
              </p>
              <p style={{color:'#5A6A79',fontSize:9,margin:0}}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════════════
# 6. MarketingModule: real Firestore stats
# ══════════════════════════════════════════════════════════════════════
w("src/components/admin/modules/MarketingModule.tsx", """import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MarketingModule() {
  const [stats, setStats] = useState({
    total:0, dau:0, walletConnected:0, totalEarned:0, stakers:0,
  });

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      const now   = Date.now();
      const day   = 86400000;
      let dau=0, wallets=0, earned=0, stakers=0;
      snap.docs.forEach(d => {
        const data = d.data();
        if ((data.lastSyncAt ?? 0) > now - day) dau++;
        if (data.walletAddress) wallets++;
        earned += data.totalEarned ?? 0;
        if (data.totalStaked > 0) stakers++;
      });
      setStats({ total: snap.size, dau, walletConnected: wallets, totalEarned: earned, stakers });
    });
  }, []);

  const walletPct = stats.total > 0 ? ((stats.walletConnected / stats.total) * 100).toFixed(1) : '0.0';

  const cards = [
    { label:'Total Players',    value: stats.total.toLocaleString(),           color:'#E8E8E8' },
    { label:'Active Today (DAU)',value: stats.dau.toLocaleString(),             color:'#4FC3F7' },
    { label:'Wallet Connected', value: stats.walletConnected.toLocaleString(), color:'#D4AF37' },
    { label:'Wallet Conv. Rate', value: walletPct + '%',                       color:'#A5D6A7' },
    { label:'Total BB Earned',  value: stats.totalEarned.toLocaleString(),     color:'#CE93D8' },
    { label:'Active Stakers',   value: stats.stakers.toLocaleString(),         color:'#FFB74D' },
  ];

  return (
    <div style={{padding:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {cards.map(c => (
          <div key={c.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'12px 14px'}}>
            <p style={{color:'#5A6A79',fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px'}}>{c.label}</p>
            <p style={{color:c.color,fontSize:18,fontWeight:900,margin:0}}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Wallet funnel */}
      <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',
        letterSpacing:'0.08em',margin:'0 0 10px'}}>Wallet Connect Funnel</p>
      <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
        border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:14}}>
        {[
          { label:'Total Players',       count: stats.total,           pct: 100 },
          { label:'Connected Wallet',    count: stats.walletConnected, pct: stats.total > 0 ? (stats.walletConnected/stats.total)*100 : 0 },
          { label:'Staking',             count: stats.stakers,         pct: stats.total > 0 ? (stats.stakers/stats.total)*100 : 0 },
        ].map(row => (
          <div key={row.label} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{color:'#C0C0C0',fontSize:11}}>{row.label}</span>
              <span style={{color:'#5A6A79',fontSize:11}}>{row.count.toLocaleString()} ({row.pct.toFixed(1)}%)</span>
            </div>
            <div style={{height:6,borderRadius:3,background:'#1A1A1D',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:3,width:row.pct+'%',
                background:'linear-gradient(90deg,#0288D1,#4FC3F7)',transition:'width 0.8s ease'}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════════════
# 7. SupportModule: real users list
# ══════════════════════════════════════════════════════════════════════
w("src/components/admin/modules/SupportModule.tsx", """import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdminUser } from '@/models/types';

interface Props { adminUser: AdminUser; }

interface UserRow {
  id: string; firstName: string; username: string;
  balance: number; totalEarned: number; lastSyncAt: number; role: string;
}

export default function SupportModule({ adminUser: _adminUser }: Props) {
  const [users,  setUsers]  = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalEarned', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserRow)));
    });
    return unsub;
  }, []);

  const filtered = users.filter(u =>
    u.username?.includes(search) ||
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.id.includes(search)
  );

  return (
    <div style={{padding:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
        {[
          { label:'Total Users', value: users.length },
          { label:'With Balance', value: users.filter(u => u.balance > 0).length },
          { label:'Active Today', value: users.filter(u => u.lastSyncAt > Date.now()-86400000).length },
        ].map(s => (
          <div key={s.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px'}}>
            <p style={{color:'#5A6A79',fontSize:9,textTransform:'uppercase',margin:'0 0 2px'}}>{s.label}</p>
            <p style={{color:'#4FC3F7',fontSize:18,fontWeight:900,margin:0}}>{s.value}</p>
          </div>
        ))}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, username, or ID..."
        style={{width:'100%',background:'#0A0A0D',border:'1px solid #2A2A2D',
          borderRadius:10,padding:'10px 14px',color:'#E8E8E8',fontSize:12,
          outline:'none',boxSizing:'border-box',marginBottom:12,
          WebkitUserSelect:'auto',touchAction:'auto'}}/>

      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map(user => (
          <div key={user.id} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 14px',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,margin:'0 0 2px'}}>
                {user.firstName} {user.username ? '@'+user.username : ''}
              </p>
              <p style={{color:'#5A6A79',fontSize:10,margin:0}}>
                ID: {user.id} · Last active: {new Date(user.lastSyncAt ?? 0).toLocaleDateString()}
              </p>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <p style={{color:'#D4AF37',fontSize:12,fontWeight:700,margin:'0 0 2px'}}>
                {(user.balance ?? 0).toLocaleString()} BB
              </p>
              <p style={{color:'#5A6A79',fontSize:9,margin:0}}>{user.role}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'20px 0'}}>No users found</p>
        )}
      </div>
    </div>
  );
}
""")

# ══════════════════════════════════════════════════════════════════════
# 8. App.tsx: add WalletPage route
# ══════════════════════════════════════════════════════════════════════
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
            <SplashScreen onComplete={() => setSplashDone(true)}/>
          ) : (
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  <Route path="/"            element={<Home/>}/>
                  <Route path="/leaderboard" element={
                    <div style={{display:'flex',flexDirection:'column',height:'100%',
                      background:'radial-gradient(ellipse 80% 40% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
                      <Leaderboard/><Navigation/>
                    </div>
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

# ── Push
print("\\nPushing all fixes...")
run("git add -A")
run('git commit -m "feat: RBAC admin real data, task system wallet page, TON staking wallet"')
code = run("git push origin main")
if code == 0:
    print("Done! ~60s to deploy.")
else:
    print("Push failed. Run: git push origin main")
