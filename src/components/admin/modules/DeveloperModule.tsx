import { useState, useEffect } from 'react';
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
