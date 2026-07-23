import { useState, useEffect, useRef } from 'react';
import {
  collection, onSnapshot, query, orderBy, limit, getDocs,
  doc, setDoc, addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Task {
  id: string; title: string; description: string;
  reward: number; status: 'locked' | 'active'; icon: string; link?: string; createdAt: number;
}
interface Log {
  id: string; telegramId: string; reason: string;
  clicksReported: number; maxAllowed: number; timestamp: number;
}

export default function DeveloperModule() {
  const [tab,           setTab]           = useState<'metrics'|'tasks'|'config'>('tasks');
  const [userCount,     setUserCount]     = useState(0);
  const [activeUsers,   setActiveUsers]   = useState(0);
  const [logs,          setLogs]          = useState<Log[]>([]);
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [stakingWallet, setStakingWallet] = useState('');
  const [savedWallet,   setSavedWallet]   = useState('');
  const [walletSaved,   setWalletSaved]   = useState(false);
  const [newTask,       setNewTask]       = useState({ title:'', description:'', reward:'', icon:'🎯', link:'' });
  const [taskError,     setTaskError]     = useState('');
  const [taskSuccess,   setTaskSuccess]   = useState('');
  const [adding,        setAdding]        = useState(false);

  // Use refs to keep subscriptions stable
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    // Metrics
    getDocs(collection(db, 'users')).then(snap => {
      setUserCount(snap.size);
      setActiveUsers(snap.docs.filter(d => (d.data().lastSyncAt ?? 0) > Date.now()-86400000).length);
    });

    // Anti-cheat logs
    const unsubLogs = onSnapshot(
      query(collection(db, 'antiCheatLogs'), orderBy('timestamp','desc'), limit(15)),
      snap => setLogs(snap.docs.map(d => ({id:d.id,...d.data()}) as Log)),
      err => console.error('logs error:', err)
    );

    // Tasks — stable subscription
    const unsubTasks = onSnapshot(
      query(collection(db,'tasks'), orderBy('createdAt','asc')),
      snap => {
        const list = snap.docs.map(d => ({id:d.id,...d.data()}) as Task);
        tasksRef.current = list;
        setTasks(list);
      },
      err => {
        console.error('tasks error:', err.code, err.message);
        setTaskError('Rules error: ' + err.message);
      }
    );

    // Config
    const unsubConfig = onSnapshot(doc(db,'config','staking'), snap => {
      if (snap.exists()) {
        setStakingWallet(snap.data().receiveWallet ?? '');
        setSavedWallet(snap.data().receiveWallet ?? '');
      }
    }, () => {});

    return () => { unsubLogs(); unsubTasks(); unsubConfig(); };
  }, []); // empty dep array — subscribe once, stay stable

  const saveWallet = async () => {
    await setDoc(doc(db,'config','staking'), { receiveWallet: stakingWallet, updatedAt: serverTimestamp() }, { merge:true });
    setSavedWallet(stakingWallet); setWalletSaved(true); setTimeout(()=>setWalletSaved(false),2000);
  };

  const addTask = async () => {
    if (!newTask.title.trim()) { setTaskError('Title is required'); return; }
    if (!newTask.reward || Number(newTask.reward) <= 0) { setTaskError('Reward must be greater than 0'); return; }
    setAdding(true); setTaskError(''); setTaskSuccess('');
    try {
      const payload: Record<string,unknown> = {
        title:       newTask.title.trim(),
        description: newTask.description.trim(),
        icon:        newTask.icon || '🎯',
        reward:      Number(newTask.reward),
        status:      'locked',
        createdAt:   Date.now(),
        serverTimestamp: serverTimestamp(),
      };
      if (newTask.link.trim()) payload.link = newTask.link.trim();
      await addDoc(collection(db,'tasks'), payload);
      setNewTask({ title:'', description:'', reward:'', icon:'🎯', link:'' });
      setTaskSuccess('Task created! Tap Unlock to make it visible to users.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTaskError('Failed: ' + msg + ' — Check Firestore rules (tasks must allow write)');
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await updateDoc(doc(db,'tasks',task.id), {
        status: task.status === 'locked' ? 'active' : 'locked',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTaskError('Toggle failed: ' + msg);
    }
  };

  const TABS = [
    { id:'tasks'   as const, label:'Tasks'   },
    { id:'metrics' as const, label:'Metrics' },
    { id:'config'  as const, label:'Config'  },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Sub-tabs */}
      <div style={{display:'flex',borderBottom:'1px solid #1A1A1D',background:'#0A0A0F',flexShrink:0}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'8px 16px',fontSize:11,fontWeight:600,background:'transparent',
              border:'none',cursor:'pointer',
              color: tab===t.id ? '#E8E8E8' : '#5A6A79',
              borderBottom:`2px solid ${tab===t.id ? '#4FC3F7' : 'transparent'}`,
              transition:'all 0.15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:16}}>

        {/* ── TASKS TAB ── */}
        {tab === 'tasks' && (
          <div>
            {/* New task form */}
            <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
              border:'1px solid rgba(212,175,55,0.25)',borderRadius:12,padding:14,marginBottom:16}}>
              <p style={{color:'#D4AF37',fontSize:11,fontWeight:700,margin:'0 0 12px'}}>
                + Create New Task
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <input
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({...p, title:e.target.value}))}
                  placeholder="Task title (required)"
                  style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                    padding:'10px 12px',color:'#E8E8E8',fontSize:12,outline:'none',
                    WebkitUserSelect:'auto',touchAction:'auto'}}/>
                <input
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({...p, description:e.target.value}))}
                  placeholder="Description — what users need to do"
                  style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                    padding:'10px 12px',color:'#E8E8E8',fontSize:12,outline:'none',
                    WebkitUserSelect:'auto',touchAction:'auto'}}/>
                <input
                  value={newTask.link}
                  onChange={e => setNewTask(p => ({...p, link:e.target.value}))}
                  placeholder="Link (optional) — https://..."
                  style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                    padding:'10px 12px',color:'#E8E8E8',fontSize:12,outline:'none',
                    WebkitUserSelect:'auto',touchAction:'auto'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <input
                    type="number"
                    value={newTask.reward}
                    onChange={e => setNewTask(p => ({...p, reward:e.target.value}))}
                    placeholder="Reward in BB"
                    style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                      padding:'10px 12px',color:'#E8E8E8',fontSize:12,outline:'none',
                      WebkitUserSelect:'auto',touchAction:'auto'}}/>
                  <input
                    value={newTask.icon}
                    onChange={e => setNewTask(p => ({...p, icon:e.target.value}))}
                    placeholder="Emoji icon"
                    style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                      padding:'10px 12px',color:'#E8E8E8',fontSize:16,outline:'none',
                      textAlign:'center',WebkitUserSelect:'auto',touchAction:'auto'}}/>
                </div>

                {taskError && (
                  <p style={{color:'#EF9A9A',fontSize:11,margin:0,padding:'8px 10px',
                    background:'rgba(239,83,80,0.08)',borderRadius:8,lineHeight:1.5}}>
                    {taskError}
                  </p>
                )}
                {taskSuccess && (
                  <p style={{color:'#A5D6A7',fontSize:11,margin:0,padding:'8px 10px',
                    background:'rgba(165,214,167,0.08)',borderRadius:8}}>
                    {taskSuccess}
                  </p>
                )}

                <button onClick={addTask} disabled={adding || !newTask.title || !newTask.reward}
                  style={{padding:'11px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',border:'none',
                    background: (!newTask.title || !newTask.reward)
                      ? '#2A2A2D'
                      : 'linear-gradient(180deg,#D0D0D0,#9A9A9A)',
                    color: (!newTask.title || !newTask.reward) ? '#5A6A79' : '#111',
                    opacity: adding ? 0.7 : 1}}>
                  {adding ? 'Creating...' : 'Create Task (starts locked)'}
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
              letterSpacing:'0.08em',margin:'0 0 8px',fontWeight:700}}>
              All Tasks ({tasks.length})
            </p>
            {tasks.length === 0 ? (
              <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'24px 0'}}>
                No tasks yet. Create one above.
              </p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {tasks.map(task => (
                  <div key={task.id} style={{
                    background:'linear-gradient(145deg,#141416,#0F0F11)',
                    border:`1px solid ${task.status==='active'?'rgba(165,214,167,0.35)':'rgba(255,255,255,0.07)'}`,
                    borderRadius:10,padding:'12px 14px',
                    display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:20,flexShrink:0}}>{task.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,margin:0,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {task.title}
                        </p>
                        <span style={{
                          fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:10,flexShrink:0,
                          background: task.status==='active'?'rgba(165,214,167,0.15)':'rgba(90,90,90,0.2)',
                          color: task.status==='active'?'#A5D6A7':'#5A6A79',
                        }}>
                          {task.status.toUpperCase()}
                        </span>
                      </div>
                      <p style={{color:'#5A6A79',fontSize:10,margin:0}}>{task.description}</p>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <p style={{color:'#FFD700',fontSize:12,fontWeight:900,margin:'0 0 5px'}}>
                        +{task.reward.toLocaleString()} BB
                      </p>
                      <button onClick={() => toggleTask(task)}
                        style={{padding:'4px 10px',borderRadius:6,fontSize:10,fontWeight:700,
                          cursor:'pointer',border:'none',
                          background: task.status==='active'
                            ? 'rgba(239,83,80,0.2)' : 'rgba(165,214,167,0.2)',
                          color: task.status==='active' ? '#EF5350' : '#A5D6A7'}}>
                        {task.status==='active' ? 'Lock' : 'Unlock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── METRICS TAB ── */}
        {tab === 'metrics' && (
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20}}>
              {[
                { label:'Total Users',   value:userCount,   color:'#4FC3F7' },
                { label:'Active (24h)',  value:activeUsers, color:'#A5D6A7' },
                { label:'Cheat Blocks', value:logs.length, color:'#EF9A9A' },
              ].map(m => (
                <div key={m.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
                  border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px'}}>
                  <p style={{color:'#5A6A79',fontSize:9,textTransform:'uppercase',margin:'0 0 4px'}}>{m.label}</p>
                  <p style={{color:m.color,fontSize:20,fontWeight:900,margin:0}}>{m.value}</p>
                </div>
              ))}
            </div>
            <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',
              letterSpacing:'0.08em',margin:'0 0 8px'}}>Anti-Cheat Log (live)</p>
            <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
              border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
              {logs.length === 0
                ? <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'20px 0'}}>No violations</p>
                : logs.map(log => (
                  <div key={log.id} style={{display:'flex',justifyContent:'space-between',
                    padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div>
                      <p style={{color:'#C0C0C0',fontSize:11,fontWeight:600,margin:'0 0 2px'}}>{log.telegramId}</p>
                      <p style={{color:'#5A6A79',fontSize:10,margin:0}}>{log.reason}</p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <p style={{color:'#EF5350',fontSize:11,fontWeight:700,margin:'0 0 2px'}}>{log.clicksReported} clicks</p>
                      <p style={{color:'#5A6A79',fontSize:9,margin:0}}>{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── CONFIG TAB ── */}
        {tab === 'config' && (
          <div>
            <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
              border:'1px solid rgba(79,195,247,0.2)',borderRadius:12,padding:16,marginBottom:16}}>
              <p style={{color:'#4FC3F7',fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:'0.08em',margin:'0 0 8px'}}>TON Staking Receive Wallet</p>
              <input value={stakingWallet} onChange={e=>setStakingWallet(e.target.value)}
                placeholder="EQ... or UQ... TON wallet address"
                style={{width:'100%',background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                  padding:'10px 12px',color:'#E8E8E8',fontSize:11,outline:'none',
                  boxSizing:'border-box',fontFamily:'monospace',WebkitUserSelect:'auto',touchAction:'auto'}}/>
              <button onClick={saveWallet} style={{marginTop:8,width:'100%',padding:'10px',borderRadius:8,
                fontWeight:700,fontSize:12,cursor:'pointer',border:'none',
                background:'linear-gradient(180deg,#D0D0D0,#9A9A9A)',color:'#111'}}>
                {walletSaved ? 'Saved!' : 'Save Wallet Address'}
              </button>
              {savedWallet && (
                <p style={{color:'#3A3A45',fontSize:9,margin:'6px 0 0',
                  wordBreak:'break-all',fontFamily:'monospace'}}>
                  Current: {savedWallet}
                </p>
              )}
            </div>

            <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
              border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:14}}>
              <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:'0.08em',margin:'0 0 10px'}}>Staking Tiers (edit in code)</p>
              {[
                { label:'Starter',  ton:5,  days:7,  apy:12,  color:'#CD7F32' },
                { label:'Advanced', ton:25, days:30, apy:36,  color:'#C0C0C0' },
                { label:'Elite',    ton:50, days:90, apy:120, color:'#D4AF37' },
              ].map(t => (
                <div key={t.label} style={{display:'flex',justifyContent:'space-between',
                  padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{color:t.color,fontSize:12,fontWeight:700}}>{t.label}</span>
                  <span style={{color:'#C0C0C0',fontSize:12}}>{t.ton} TON</span>
                  <span style={{color:'#5A6A79',fontSize:11}}>{t.days} days</span>
                  <span style={{color:t.color,fontSize:12,fontWeight:700}}>{t.apy}% APY</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
