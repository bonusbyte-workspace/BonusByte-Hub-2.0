import { useState } from 'react';
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

        {/* TON Wallet Card */}
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

        {/* Tasks */}
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
          letterSpacing:'0.1em',margin:'0 0 12px',fontWeight:700}}>Tasks</p>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {slots.map((task, i) => {
            if (!task) return (
              <div key={'empty-'+i} style={{background:'rgba(17,17,19,0.5)',
                border:'1px dashed rgba(255,255,255,0.05)',borderRadius:16,
                padding:'18px 20px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:'#0A0A0D',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,opacity:0.3}}>
                  🔒
                </div>
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
                style={{
                  width:'100%',textAlign:'left',
                  cursor: isLocked || isDone ? 'default' : 'pointer',
                  background: isDone
                    ? 'linear-gradient(145deg,rgba(165,214,167,0.07),rgba(17,17,19,0.95))'
                    : isLocked ? 'rgba(17,17,19,0.5)'
                    : 'linear-gradient(145deg,rgba(79,195,247,0.06),rgba(17,17,19,0.98))',
                  border:`1px solid ${isDone ? 'rgba(165,214,167,0.25)' : isLocked ? 'rgba(255,255,255,0.04)' : 'rgba(79,195,247,0.18)'}`,
                  borderRadius:16,padding:'16px 18px',
                  display:'flex',alignItems:'center',gap:14,
                }}>
                <div style={{
                  width:44,height:44,borderRadius:12,flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
                  background: isDone ? 'rgba(165,214,167,0.1)' : isLocked ? 'rgba(26,26,29,0.8)' : 'rgba(79,195,247,0.08)',
                  filter: isLocked ? 'grayscale(1) brightness(0.4)' : 'none',
                }}>
                  {isDone ? 'done' : isLocked ? 'lock' : task.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{
                    color: isDone ? '#A5D6A7' : isLocked ? '#2A2A2D' : '#D0D0D0',
                    fontSize:13,fontWeight:700,margin:'0 0 3px',
                    filter: isLocked ? 'blur(5px)' : 'none',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                  }}>
                    {isLocked ? 'Hidden task' : task.title}
                  </p>
                  <p style={{color:'#5A6A79',fontSize:11,margin:0}}>
                    {isDone ? 'Completed' : isLocked ? 'Locked' : task.description}
                  </p>
                </div>
                {!isLocked && (
                  <div style={{flexShrink:0,textAlign:'right'}}>
                    <p style={{fontSize:15,fontWeight:900,margin:'0 0 2px',
                      color: isDone ? '#A5D6A7' : '#FFD700'}}>
                      +{task.reward.toLocaleString()}
                    </p>
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
