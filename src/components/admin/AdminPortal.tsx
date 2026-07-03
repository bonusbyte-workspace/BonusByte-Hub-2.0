import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import type { AdminModule } from '@/models/types';
import DeveloperModule from './modules/DeveloperModule';
import SupportModule   from './modules/SupportModule';
import EconomyModule   from './modules/EconomyModule';
import MarketingModule from './modules/MarketingModule';

const ALL_MODULES = [
  { id: 'developer' as AdminModule, label: 'Developer', icon: '⚙️',
    roles: ['developer'] },
  { id: 'support'   as AdminModule, label: 'Support',   icon: '🎧',
    roles: ['developer', 'support'] },
  { id: 'economy'   as AdminModule, label: 'Economy',   icon: '💰',
    roles: ['developer', 'economy'] },
  { id: 'marketing' as AdminModule, label: 'Marketing', icon: '📈',
    roles: ['developer', 'economy', 'support'] },
];

function ModuleContent({ id, adminUser }: { id: AdminModule; adminUser: { uid: string; email: string; role: string } }) {
  switch (id) {
    case 'developer': return <DeveloperModule />;
    case 'support':   return <SupportModule adminUser={adminUser as never} />;
    case 'economy':   return <EconomyModule />;
    case 'marketing': return <MarketingModule />;
    default:          return null;
  }
}

export default function AdminPortal() {
  const { adminUser, logout } = useAuth();

  // Only show tabs this role can access
  const accessible = useMemo(() =>
    ALL_MODULES.filter(m => adminUser && m.roles.includes(adminUser.role)),
    [adminUser]
  );

  // Default to user's own section (first accessible tab)
  const [activeModule, setActiveModule] = useState<AdminModule>(
    () => accessible[0]?.id ?? 'developer'
  );

  if (!adminUser) return null;

  // Ensure activeModule is still accessible (safety check)
  const current = accessible.find(m => m.id === activeModule)
    ? activeModule
    : accessible[0]?.id ?? 'developer';

  return (
    <div style={{position:'fixed',inset:0,background:'#05050A',
      display:'flex',flexDirection:'column',color:'#E8E8E8',overflow:'hidden'}}>

      {/* Top bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'12px 16px',borderBottom:'1px solid #1A1A1D',background:'#0A0A0F'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{margin:0,fontSize:13,fontWeight:900,
              background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              BonusByte Admin
            </p>
            <p style={{margin:0,fontSize:10,color:'#5A6A79',textTransform:'capitalize'}}>
              {adminUser.role} · {adminUser.email}
            </p>
          </div>
        </div>
        <button onClick={logout}
          style={{background:'transparent',border:'1px solid #2A2A2D',color:'#9A9A9A',
            borderRadius:8,padding:'6px 12px',fontSize:11,cursor:'pointer'}}>
          Sign Out
        </button>
      </div>

      {/* Role badge */}
      <div style={{padding:'8px 16px 0',background:'#0A0A0F',
        borderBottom:'1px solid #1A1A1D'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <span style={{
            padding:'2px 10px',borderRadius:20,fontSize:10,fontWeight:700,
            textTransform:'uppercase',letterSpacing:'0.08em',
            background: adminUser.role === 'developer' ? 'rgba(79,195,247,0.15)' :
                        adminUser.role === 'support'   ? 'rgba(165,214,167,0.15)' :
                        'rgba(212,175,55,0.15)',
            color: adminUser.role === 'developer' ? '#4FC3F7' :
                   adminUser.role === 'support'   ? '#A5D6A7' :
                   '#D4AF37',
            border: `1px solid ${
              adminUser.role === 'developer' ? 'rgba(79,195,247,0.3)' :
              adminUser.role === 'support'   ? 'rgba(165,214,167,0.3)' :
              'rgba(212,175,55,0.3)'
            }`,
          }}>
            {adminUser.role}
          </span>
          <span style={{color:'#3A3A3A',fontSize:10}}>
            {accessible.length} section{accessible.length !== 1 ? 's' : ''} accessible
          </span>
        </div>

        {/* Module tabs — only show accessible ones */}
        <div style={{display:'flex',gap:0,overflowX:'auto'}}>
          {accessible.map(mod => (
            <button key={mod.id} onClick={() => setActiveModule(mod.id)}
              style={{
                padding:'8px 16px',fontSize:12,fontWeight:600,
                whiteSpace:'nowrap',background:'transparent',border:'none',
                cursor:'pointer',position:'relative',
                color: current === mod.id ? '#E8E8E8' : '#5A6A79',
                borderBottom: current === mod.id
                  ? '2px solid #4FC3F7' : '2px solid transparent',
                transition:'all 0.15s ease',
              }}>
              <span style={{marginRight:5}}>{mod.icon}</span>
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto'}}>
        <motion.div key={current}
          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          transition={{duration:0.2}}>
          <ModuleContent id={current} adminUser={adminUser}/>
        </motion.div>
      </div>
    </div>
  );
}
