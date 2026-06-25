import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const TABS = [
  {
    id:    'home',
    path:  '/',
    label: 'Earn',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="12" r="9"
          stroke={active ? '#4FC3F7' : '#5A6A79'}
          strokeWidth="1.5"
          fill={active ? 'rgba(79,195,247,0.1)' : 'none'}
        />
        <path
          d="M12 7v5l3 3"
          stroke={active ? '#4FC3F7' : '#5A6A79'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {active && (
          <circle cx="12" cy="12" r="2" fill="#4FC3F7" />
        )}
      </svg>
    ),
  },
  {
    id:    'leaderboard',
    path:  '/leaderboard',
    label: 'Ranks',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3"  y="10" width="4" height="11" rx="1" fill={active ? '#4FC3F7' : '#5A6A79'} opacity={active ? 1 : 0.5} />
        <rect x="10" y="5"  width="4" height="16" rx="1" fill={active ? '#4FC3F7' : '#5A6A79'} />
        <rect x="17" y="13" width="4" height="8"  rx="1" fill={active ? '#4FC3F7' : '#5A6A79'} opacity={active ? 1 : 0.5} />
        {active && <rect x="10" y="3" width="4" height="2" rx="1" fill="#4FC3F7" />}
      </svg>
    ),
  },
  {
    id:    'staking',
    path:  '/staking',
    label: 'Stake',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2.5 5.5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.7.9-5.5-4-3.9 5.5-.8L12 3z"
          stroke={active ? '#D4AF37' : '#5A6A79'}
          strokeWidth="1.5"
          fill={active ? 'rgba(212,175,55,0.15)' : 'none'}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id:    'wallet',
    path:  '/wallet',
    label: 'Wallet',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="2" y="6" width="20" height="14" rx="2"
          stroke={active ? '#4FC3F7' : '#5A6A79'}
          strokeWidth="1.5"
          fill={active ? 'rgba(79,195,247,0.08)' : 'none'}
        />
        <path d="M2 10h20" stroke={active ? '#4FC3F7' : '#5A6A79'} strokeWidth="1.5" />
        <circle cx="17" cy="15" r="1.5" fill={active ? '#4FC3F7' : '#5A6A79'} />
      </svg>
    ),
  },
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="nav-bar fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-40">
      <div className="flex items-center justify-around px-2 pb-safe">
        {TABS.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.id}
              className="flex flex-col items-center gap-1 py-3 px-4 relative"
              onClick={() => navigate(tab.path)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="nav-icon" style={active ? { filter: 'drop-shadow(0 0 6px rgba(79,195,247,0.7))' } : {}}>
                {tab.icon(active)}
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? '#4FC3F7' : '#5A6A79' }}
              >
                {tab.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute top-1 w-1 h-1 rounded-full bg-energy-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
