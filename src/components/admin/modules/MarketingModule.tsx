export default function MarketingModule() {
  const stats = {
    dau:                  4_820,
    mau:                  31_400,
    walletConversionRate: 23.4,
    totalStakedVolume:    1_445_700,
    referralCount:        8_932,
    newUsersToday:        347,
  };

  const cards = [
    { label: 'DAU',              value: stats.dau.toLocaleString(),                  accent: '#4FC3F7', delta: '+8%'  },
    { label: 'MAU',              value: stats.mau.toLocaleString(),                  accent: '#A5D6A7', delta: '+14%' },
    { label: 'Wallet Connect %', value: `${stats.walletConversionRate}%`,            accent: '#D4AF37', delta: '+2%'  },
    { label: 'Staked Volume',    value: `${(stats.totalStakedVolume / 1e6).toFixed(2)}M BB`, accent: '#CE93D8', delta: '+22%' },
    { label: 'Referrals',        value: stats.referralCount.toLocaleString(),        accent: '#FFB74D', delta: '+31%' },
    { label: 'New Users Today',  value: stats.newUsersToday.toLocaleString(),        accent: '#80CBC4', delta: '+12%' },
  ];

  // Simple sparkline values (mock)
  const dauSparkline = [210, 280, 310, 270, 390, 420, 480, 482];

  return (
    <div className="p-5 space-y-5">
      <h3 className="chrome-text text-sm font-black uppercase tracking-widest mb-1">
        Growth Analytics
      </h3>
      <p className="text-steel-400 text-xs mb-4">Live data · Updates every 5 min</p>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {cards.map(card => (
          <div key={card.label} className="admin-metric-card">
            <p className="text-steel-400 text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
            <p className="font-black text-xl leading-none" style={{ color: card.accent }}>
              {card.value}
            </p>
            <p className="text-green-400 text-[10px] mt-1">{card.delta} vs last week</p>
          </div>
        ))}
      </div>

      {/* DAU Sparkline */}
      <div className="chrome-surface rounded-xl p-4">
        <p className="text-steel-400 text-[10px] uppercase tracking-widest mb-3">DAU Trend (last 8 days)</p>
        <div className="flex items-end gap-1 h-16">
          {dauSparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height:     `${(v / Math.max(...dauSparkline)) * 100}%`,
                background: i === dauSparkline.length - 1
                  ? 'linear-gradient(180deg, #4FC3F7 0%, #0288D1 100%)'
                  : 'rgba(79,195,247,0.3)',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-steel-400 text-[9px]">8 days ago</span>
          <span className="text-steel-400 text-[9px]">Today</span>
        </div>
      </div>

      {/* Wallet funnel */}
      <div className="chrome-surface rounded-xl p-4">
        <p className="text-steel-400 text-[10px] uppercase tracking-widest mb-3">Wallet Connect Funnel</p>
        {[
          { label: 'Total Players',        pct: 100,  count: stats.mau },
          { label: 'Prompted to Connect',  pct: 68,   count: Math.round(stats.mau * 0.68) },
          { label: 'Connected Wallet',     pct: 23.4, count: Math.round(stats.mau * 0.234) },
        ].map(step => (
          <div key={step.label} className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-chrome-300 text-xs">{step.label}</span>
              <span className="text-steel-400 text-xs">{step.count.toLocaleString()} ({step.pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-obsidian-700 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${step.pct}%`,
                  background: 'linear-gradient(90deg, #0288D1, #4FC3F7)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
