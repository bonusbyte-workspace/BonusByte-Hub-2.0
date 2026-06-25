import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import type { AdminModule } from '@/models/types';
import DeveloperModule  from './modules/DeveloperModule';
import SupportModule    from './modules/SupportModule';
import EconomyModule    from './modules/EconomyModule';
import MarketingModule  from './modules/MarketingModule';

interface ModuleConfig {
  id:        AdminModule;
  label:     string;
  roles:     string[];
  icon:      string;
}

const MODULES: ModuleConfig[] = [
  { id: 'developer', label: 'Developer',  roles: ['developer'],                         icon: '⚙️' },
  { id: 'support',   label: 'Support',    roles: ['developer', 'support'],               icon: '🎧' },
  { id: 'economy',   label: 'Economy',    roles: ['developer', 'economy'],               icon: '💰' },
  { id: 'marketing', label: 'Marketing',  roles: ['developer', 'economy', 'support'],    icon: '📈' },
];

export default function AdminPortal() {
  const { adminUser, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<AdminModule>('developer');

  const accessibleModules = MODULES.filter(m =>
    adminUser && m.roles.includes(adminUser.role)
  );

  const renderModule = () => {
    switch (activeModule) {
      case 'developer': return <DeveloperModule />;
      case 'support':   return <SupportModule adminUser={adminUser!} />;
      case 'economy':   return <EconomyModule />;
      case 'marketing': return <MarketingModule />;
    }
  };

  return (
    <div className="fixed inset-0 bg-obsidian-950 flex flex-col text-chrome-200 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-obsidian-700 bg-obsidian-900">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-7 h-7 object-contain" />
          <div>
            <h1 className="chrome-text text-sm font-black leading-none">BonusByte Admin</h1>
            <p className="text-steel-400 text-[10px] capitalize">{adminUser?.role} · {adminUser?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-steel-400 text-xs border border-obsidian-600 rounded-lg px-3 py-1.5 hover:border-chrome-600 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Module tabs */}
      <div className="flex border-b border-obsidian-700 bg-obsidian-900 overflow-x-auto">
        {accessibleModules.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={`px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all relative ${
              activeModule === mod.id ? 'text-chrome-200' : 'text-steel-400 hover:text-chrome-400'
            }`}
          >
            <span className="mr-1">{mod.icon}</span>
            {mod.label}
            {activeModule === mod.id && (
              <motion.div
                layoutId="admin-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-energy-400"
              />
            )}
          </button>
        ))}
      </div>

      {/* Module content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          key={activeModule}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderModule()}
        </motion.div>
      </div>
    </div>
  );
}
