import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import type { AdminModule } from '@/models/types';
import DeveloperModule from './modules/DeveloperModule';
import SupportModule   from './modules/SupportModule';
import MarketingModule from './modules/MarketingModule';

const ALL_MODULES = [
  { id: 'developer' as AdminModule, label: 'Developer', icon: '⚙️', roles: ['developer'] },
  { id: 'support'   as AdminModule, label: 'Support',   icon: '🎧', roles: ['developer', 'support'] },
  { id: 'marketing' as AdminModule, label: 'Analytics', icon: '📈', roles: ['developer', 'support'] },
];

function ModuleContent({ id, adminUser }: { id: AdminModule; adminUser: { uid: string; email: string; role: string } }) {
  if (id === 'developer') return <DeveloperModule/>;
  if (id === 'support')   return <SupportModule adminUser={adminUser as never}/>;
  if (id === 'marketing') return <MarketingModule/>;
  return null;
}

export default function AdminPortal() {
  const { adminUser, logout } = useAuth();
  const accessible = useMemo(() =>
    ALL_MODULES.filter(m => adminUser && m.roles.includes(adminUser.role)), [adminUser]);
  const [activeModule, setActiveModule] = useState<AdminModule>(() => accessible[0]?.id ?? 'developer');
  if (!adminUser) return null;
  const current = accessible.find(m => m.id === activeModule) ? activeModule : accessible[0]?.id ?? 'developer';

  return (
    <div style={{position:'fixed',inset:0,background:'#05050A',display:'flex',flexDirection:'column',color:'#E8E8E8',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'12px 16px',borderBottom:'1px solid #1A1A1D',background:'#0A0A0F'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{margin:0,fontSize:13,fontWeight:900,
              background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>BonusByte Admin</p>
            <p style={{margin:0,fontSize:10,color:'#5A6A79',textTransform:'capitalize'}}>
              {adminUser.role} · {adminUser.email}
            </p>
          </div>
        </div>
        <button onClick={logout} style={{background:'transparent',border:'1px solid #2A2A2D',
          color:'#9A9A9A',borderRadius:8,padding:'6px 12px',fontSize:11,cursor:'pointer'}}>
          Sign Out
        </button>
      </div>

      <div style={{borderBottom:'1px solid #1A1A1D',background:'#0A0A0F'}}>
        <div style={{display:'flex',padding:'0 4px'}}>
          {accessible.map(mod => (
            <button key={mod.id} onClick={() => setActiveModule(mod.id)}
              style={{padding:'10px 16px',fontSize:12,fontWeight:600,whiteSpace:'nowrap',
                background:'transparent',border:'none',cursor:'pointer',position:'relative',
                color: current===mod.id ? '#E8E8E8' : '#5A6A79',
                borderBottom:`2px solid ${current===mod.id ? '#4FC3F7' : 'transparent'}`,
                transition:'all 0.15s'}}>
              <span style={{marginRight:5}}>{mod.icon}</span>{mod.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto'}}>
        <motion.div key={current} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.2}}>
          <ModuleContent id={current} adminUser={adminUser}/>
        </motion.div>
      </div>
    </div>
  );
}
