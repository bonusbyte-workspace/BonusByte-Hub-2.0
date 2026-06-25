import { useState } from 'react';

const INITIAL_POOLS = {
  days7:  { apy: 12,  totalStaked: 84_200,    activeStakers: 312 },
  days30: { apy: 36,  totalStaked: 241_500,   activeStakers: 718 },
  days90: { apy: 120, totalStaked: 1_120_000, activeStakers: 291 },
};

export default function EconomyModule() {
  const [pools,      setPools]      = useState(INITIAL_POOLS);
  const [totalSupply] = useState(12_400_000);
  const [saved, setSaved] = useState(false);

  const totalStaked = pools.days7.totalStaked + pools.days30.totalStaked + pools.days90.totalStaked;

  const updateAPY = (key: keyof typeof pools, value: number) => {
    setPools(prev => ({ ...prev, [key]: { ...prev[key], apy: value } }));
  };

  const save = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-5 space-y-5">
      {/* Supply Overview */}
      <div>
        <h3 className="chrome-text text-sm font-black uppercase tracking-widest mb-3">
          Economy Overview
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Supply',     value: totalSupply.toLocaleString(),    accent: '#E8E8E8' },
            { label: 'Total Staked',     value: totalStaked.toLocaleString(),    accent: '#D4AF37' },
            { label: 'Staked Ratio',     value: `${((totalStaked / totalSupply) * 100).toFixed(1)}%`, accent: '#4FC3F7' },
            { label: 'Total Stakers',    value: (pools.days7.activeStakers + pools.days30.activeStakers + pools.days90.activeStakers).toLocaleString(), accent: '#A5D6A7' },
          ].map(m => (
            <div key={m.label} className="admin-metric-card">
              <p className="text-steel-400 text-[10px] uppercase tracking-widest mb-1">{m.label}</p>
              <p className="font-black text-xl" style={{ color: m.accent }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staking Pools */}
      <div>
        <h3 className="chrome-text text-sm font-black uppercase tracking-widest mb-3">
          Staking Pool APY Control
        </h3>
        <div className="chrome-surface rounded-xl overflow-hidden">
          {([
            { key: 'days7'  as const, label: '7-Day Pool',  badge: '#CD7F32' },
            { key: 'days30' as const, label: '30-Day Pool', badge: '#C0C0C0' },
            { key: 'days90' as const, label: '90-Day Pool', badge: '#D4AF37' },
          ]).map(pool => (
            <div key={pool.key} className="px-4 py-3 border-b border-obsidian-700 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-bold" style={{ color: pool.badge }}>{pool.label}</span>
                  <p className="text-steel-400 text-[10px]">
                    {pools[pool.key].totalStaked.toLocaleString()} BB · {pools[pool.key].activeStakers} stakers
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-steel-400 text-xs">APY</span>
                  <input
                    type="number"
                    value={pools[pool.key].apy}
                    onChange={e => updateAPY(pool.key, Number(e.target.value))}
                    className="w-16 bg-obsidian-900 border border-obsidian-600 rounded-lg px-2 py-1 text-chrome-200 text-sm text-right outline-none"
                    style={{ touchAction: 'auto', userSelect: 'auto' }}
                  />
                  <span className="text-steel-400 text-xs">%</span>
                </div>
              </div>
              {/* Mini bar */}
              <div className="h-1 rounded-full bg-obsidian-700 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width:      `${(pools[pool.key].totalStaked / 1_120_000) * 100}%`,
                    background: pool.badge,
                    opacity:    0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={save}
          className="mt-3 chrome-button w-full py-2.5 rounded-xl font-bold text-obsidian-900 text-sm"
        >
          {saved ? '✓ APY Rates Saved' : 'Update APY Rates'}
        </button>
      </div>
    </div>
  );
}
