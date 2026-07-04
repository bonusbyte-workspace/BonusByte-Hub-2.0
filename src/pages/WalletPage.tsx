import { useState } from 'react';
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
    const ok = await completeTask(task);
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
