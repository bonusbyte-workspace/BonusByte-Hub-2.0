import { useState, useEffect } from 'react';
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
