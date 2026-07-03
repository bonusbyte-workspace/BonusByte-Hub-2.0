import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MarketingModule() {
  const [stats, setStats] = useState({
    total:0, dau:0, walletConnected:0, totalEarned:0, stakers:0,
  });

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      const now   = Date.now();
      const day   = 86400000;
      let dau=0, wallets=0, earned=0, stakers=0;
      snap.docs.forEach(d => {
        const data = d.data();
        if ((data.lastSyncAt ?? 0) > now - day) dau++;
        if (data.walletAddress) wallets++;
        earned += data.totalEarned ?? 0;
        if (data.totalStaked > 0) stakers++;
      });
      setStats({ total: snap.size, dau, walletConnected: wallets, totalEarned: earned, stakers });
    });
  }, []);

  const walletPct = stats.total > 0 ? ((stats.walletConnected / stats.total) * 100).toFixed(1) : '0.0';

  const cards = [
    { label:'Total Players',    value: stats.total.toLocaleString(),           color:'#E8E8E8' },
    { label:'Active Today (DAU)',value: stats.dau.toLocaleString(),             color:'#4FC3F7' },
    { label:'Wallet Connected', value: stats.walletConnected.toLocaleString(), color:'#D4AF37' },
    { label:'Wallet Conv. Rate', value: walletPct + '%',                       color:'#A5D6A7' },
    { label:'Total BB Earned',  value: stats.totalEarned.toLocaleString(),     color:'#CE93D8' },
    { label:'Active Stakers',   value: stats.stakers.toLocaleString(),         color:'#FFB74D' },
  ];

  return (
    <div style={{padding:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {cards.map(c => (
          <div key={c.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'12px 14px'}}>
            <p style={{color:'#5A6A79',fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px'}}>{c.label}</p>
            <p style={{color:c.color,fontSize:18,fontWeight:900,margin:0}}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Wallet funnel */}
      <p style={{color:'#5A6A79',fontSize:11,fontWeight:700,textTransform:'uppercase',
        letterSpacing:'0.08em',margin:'0 0 10px'}}>Wallet Connect Funnel</p>
      <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
        border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:14}}>
        {[
          { label:'Total Players',       count: stats.total,           pct: 100 },
          { label:'Connected Wallet',    count: stats.walletConnected, pct: stats.total > 0 ? (stats.walletConnected/stats.total)*100 : 0 },
          { label:'Staking',             count: stats.stakers,         pct: stats.total > 0 ? (stats.stakers/stats.total)*100 : 0 },
        ].map(row => (
          <div key={row.label} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{color:'#C0C0C0',fontSize:11}}>{row.label}</span>
              <span style={{color:'#5A6A79',fontSize:11}}>{row.count.toLocaleString()} ({row.pct.toFixed(1)}%)</span>
            </div>
            <div style={{height:6,borderRadius:3,background:'#1A1A1D',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:3,width:row.pct+'%',
                background:'linear-gradient(90deg,#0288D1,#4FC3F7)',transition:'width 0.8s ease'}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
