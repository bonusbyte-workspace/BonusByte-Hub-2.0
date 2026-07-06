import { useState, useEffect } from 'react';
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
  const [tab,           setTab]           = useState<'metrics'|'tasks'|'config'>('metrics');
  const [userCount,     setUserCount]     = useState(0);
  const [activeUsers,   setActiveUsers]   = useState(0);
  const [logs,          setLogs]          = useState<Log[]>([]);
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [stakingWallet, setStakingWallet] = useState('');
  const [savedWallet,   setSavedWallet]   = useState('');
  const [walletSaved,   setWalletSaved]   = useState(false);
  const [newTask,       setNewTask]       = useState({ title:'', description:'', reward:0, icon:'🎯', link:'' });

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUserCount(snap.size);
      setActiveUsers(snap.docs.filter(d => (d.data().lastSyncAt ?? 0) > Date.now()-86400000).length);
    });
    const q = query(collection(db, 'antiCheatLogs'), orderBy('timestamp','desc'), limit(15));
    const unsubLogs = onSnapshot(q, snap => setLogs(snap.docs.map(d => ({id:d.id,...d.data()}) as Log)));
    const unsubTasks = onSnapshot(
      query(collection(db,'tasks'), orderBy('createdAt','asc')),
      snap => setTasks(snap.docs.map(d => ({id:d.id,...d.data()}) as Task))
    );
    const unsubConfig = onSnapshot(doc(db,'config','staking'), snap => {
      if (snap.exists()) { setStakingWallet(snap.data().receiveWallet??''); setSavedWallet(snap.data().receiveWallet??''); }
    });
    return () => { unsubLogs(); unsubTasks(); unsubConfig(); };
  }, []);

  const saveWallet = async () => {
    await setDoc(doc(db,'config','staking'), { receiveWallet: stakingWallet, updatedAt: serverTimestamp() }, { merge:true });
    setSavedWallet(stakingWallet); setWalletSaved(true); setTimeout(()=>setWalletSaved(false),2000);
  };
  const addTask = async () => {
    if (!newTask.title || !newTask.reward) return;
    await addDoc(collection(db,'tasks'), { ...newTask, reward:Number(newTask.reward), status:'locked', createdAt:Date.now(), serverTimestamp:serverTimestamp() });
    setNewTask({ title:'', description:'', reward:0, icon:'🎯', link:'' });
  };
  const toggleTask = async (task: Task) => {
    await updateDoc(doc(db,'tasks',task.id), { status: task.status==='locked'?'active':'locked' });
  };

  const TABS = [
    { id:'metrics' as const, label:'Metrics' },
    { id:'tasks'   as const, label:'Tasks'   },
    { id:'config'  as const, label:'Config'  },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Sub-tabs */}
      <div style={{display:'flex',borderBottom:'1px solid #1A1A1D',background:'#0A0A0F'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'8px 16px',fontSize:11,fontWeight:600,background:'transparent',
              border:'none',cursor:'pointer',color: tab===t.id ? '#E8E8E8' : '#5A6A79',
              borderBottom:`2px solid ${tab===t.id ? '#4FC3F7' : 'transparent'}`,transition:'all 0.15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:16}}>

        {/* METRICS TAB */}
        {tab === 'metrics' && (<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20}}>
            {[
              { label:'Total Users',   value:userCount,    color:'#4FC3F7' },
              { label:'Active (24h)',  value:activeUsers,  color:'#A5D6A7' },
              { label:'Cheat Blocks', value:logs.length,  color:'#EF9A9A' },
            ].map(m => (
              <div key={m.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
                border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px'}}>
                <p style={{color:'#5A6A79',fontSize:9,textTransform:'uppercase',margin:'0 0 4px'}}>{m.label}</p>
                <p style={{color:m.color,fontSize:20,fontWeight:900,margin:0}}>{m.value}</p>
              </div>
            ))}
          </div>
          <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>
            Anti-Cheat Log (live)
          </p>
          <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
            {logs.length === 0
              ? <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'20px 0'}}>No violations</p>
              : logs.map(log => (
                <div key={log.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
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
        </>)}

        {/* TASKS TAB */}
        {tab === 'tasks' && (<>
          <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:12,padding:14,marginBottom:14}}>
            <p style={{color:'#D4AF37',fontSize:11,fontWeight:700,margin:'0 0 10px'}}>+ New Task</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(['title','description','link'] as const).map(field => (
                <input key={field} value={newTask[field] as string}
                  onChange={e => setNewTask(p => ({...p,[field]:e.target.value}))}
                  placeholder={field==='title'?'Task title':field==='description'?'What to do':'https://... link (optional)'}
                  style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,padding:'8px 12px',
                    color:'#E8E8E8',fontSize:12,outline:'none',WebkitUserSelect:'auto',touchAction:'auto'}}/>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <input type="number" value={newTask.reward||''} onChange={e=>setNewTask(p=>({...p,reward:Number(e.target.value)}))}
                  placeholder="Reward BB" style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,padding:'8px 12px',color:'#E8E8E8',fontSize:12,outline:'none',WebkitUserSelect:'auto',touchAction:'auto'}}/>
                <input value={newTask.icon} onChange={e=>setNewTask(p=>({...p,icon:e.target.value}))}
                  placeholder="Emoji" style={{background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,padding:'8px 12px',color:'#E8E8E8',fontSize:16,outline:'none',textAlign:'center',WebkitUserSelect:'auto',touchAction:'auto'}}/>
              </div>
              <button onClick={addTask} disabled={!newTask.title||!newTask.reward}
                style={{padding:'10px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',border:'none',
                  background:newTask.title&&newTask.reward?'linear-gradient(180deg,#D0D0D0,#9A9A9A)':'#2A2A2D',
                  color:newTask.title&&newTask.reward?'#111':'#5A6A79'}}>
                Add Task (starts locked)
              </button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {tasks.length===0 && <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'20px 0'}}>No tasks yet</p>}
            {tasks.map(task => (
              <div key={task.id} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
                border:`1px solid ${task.status==='active'?'rgba(165,214,167,0.3)':'rgba(255,255,255,0.06)'}`,
                borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20,flexShrink:0}}>{task.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</p>
                  <p style={{color:'#5A6A79',fontSize:10,margin:0}}>{task.description}</p>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <p style={{color:'#FFD700',fontSize:12,fontWeight:900,margin:'0 0 4px'}}>+{task.reward} BB</p>
                  <button onClick={()=>toggleTask(task)}
                    style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',border:'none',
                      background:task.status==='active'?'rgba(239,83,80,0.2)':'rgba(165,214,167,0.2)',
                      color:task.status==='active'?'#EF5350':'#A5D6A7'}}>
                    {task.status==='active'?'Lock':'Unlock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* CONFIG TAB */}
        {tab === 'config' && (<>
          <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',border:'1px solid rgba(79,195,247,0.2)',borderRadius:12,padding:16,marginBottom:16}}>
            <p style={{color:'#4FC3F7',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>
              TON Staking Receive Wallet
            </p>
            <p style={{color:'#5A6A79',fontSize:10,margin:'0 0 10px'}}>
              Users send TON to this wallet when staking. Set your TON wallet address below.
            </p>
            <input value={stakingWallet} onChange={e=>setStakingWallet(e.target.value)}
              placeholder="EQ... or UQ... TON wallet address"
              style={{width:'100%',background:'#0A0A0D',border:'1px solid #2A2A2D',borderRadius:8,
                padding:'10px 12px',color:'#E8E8E8',fontSize:11,outline:'none',
                boxSizing:'border-box',fontFamily:'monospace',WebkitUserSelect:'auto',touchAction:'auto'}}/>
            <button onClick={saveWallet} style={{marginTop:8,width:'100%',padding:'10px',borderRadius:8,
              fontWeight:700,fontSize:12,cursor:'pointer',
              background:'linear-gradient(180deg,#D0D0D0,#9A9A9A)',
              border:'1px solid rgba(200,200,200,0.3)',color:'#111'}}>
              {walletSaved ? 'Saved!' : 'Save Wallet Address'}
            </button>
            {savedWallet && (
              <p style={{color:'#3A3A45',fontSize:9,margin:'6px 0 0',wordBreak:'break-all',fontFamily:'monospace'}}>
                Current: {savedWallet}
              </p>
            )}
          </div>
          <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:14}}>
            <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px'}}>
              Staking Tiers
            </p>
            {[
              { label:'Starter',  ton:5,  days:7,  apy:12,  color:'#CD7F32' },
              { label:'Advanced', ton:25, days:30, apy:36,  color:'#C0C0C0' },
              { label:'Elite',    ton:50, days:90, apy:120, color:'#D4AF37' },
            ].map(t => (
              <div key={t.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <span style={{color:t.color,fontSize:12,fontWeight:700}}>{t.label}</span>
                <span style={{color:'#C0C0C0',fontSize:12}}>{t.ton} TON</span>
                <span style={{color:'#5A6A79',fontSize:11}}>{t.days} days</span>
                <span style={{color:t.color,fontSize:12,fontWeight:700}}>{t.apy}% APY</span>
              </div>
            ))}
            <p style={{color:'#3A3A45',fontSize:10,margin:'8px 0 0',textAlign:'center'}}>
              To change tiers, edit StakingPage.tsx source code
            </p>
          </div>
        </>)}
      </div>
    </div>
  );
}
