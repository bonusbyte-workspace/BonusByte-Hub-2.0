import { useState, useEffect } from 'react';
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
