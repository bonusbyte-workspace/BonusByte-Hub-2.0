import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTelegramUser } from '@/hooks/useTelegramUser';

const TIERS = [
  { days: 7,  ton: 5,  apy: 12,  label: 'Starter',  badge: '7 Days',
    color: '#CD7F32', glow: 'rgba(205,127,50,0.25)',  border: 'rgba(205,127,50,0.45)' },
  { days: 30, ton: 25, apy: 36,  label: 'Advanced', badge: '30 Days',
    color: '#C0C0C0', glow: 'rgba(192,192,192,0.2)',  border: 'rgba(192,192,192,0.45)' },
  { days: 90, ton: 50, apy: 120, label: 'Elite',    badge: '90 Days',
    color: '#D4AF37', glow: 'rgba(212,175,55,0.3)',   border: 'rgba(212,175,55,0.55)' },
];

export default function StakingPage() {
  const { userProfile } = useTelegramUser();
  const [selected,      setSelected]      = useState(1); // default Advanced
  const [isStaking,     setIsStaking]     = useState(false);
  const [message,       setMessage]       = useState<{type:'success'|'error',text:string}|null>(null);
  const [receiveWallet, setReceiveWallet] = useState('');
  const [tonConnectUI]  = useTonConnectUI();
  const userWallet      = useTonAddress();

  useEffect(() => {
    getDoc(doc(db, 'config', 'staking')).then(snap => {
      if (snap.exists()) setReceiveWallet(snap.data().receiveWallet ?? '');
    }).catch(() => {});
  }, []);

  const tier = TIERS[selected];

  const handleStake = async () => {
    if (!userWallet) { setMessage({ type:'error', text:'Connect your TON wallet first.' }); return; }
    if (!receiveWallet) { setMessage({ type:'error', text:'Staking pool not configured yet. Check back soon.' }); return; }
    if (isStaking) return;
    setIsStaking(true);
    setMessage(null);
    try {
      const nanoTon = (tier.ton * 1_000_000_000).toString();
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: receiveWallet,
          amount:  nanoTon,
          payload: btoa(`BBStake:${tier.label}:${tier.days}d:${userProfile?.telegramId ?? 'unknown'}`),
        }],
      });
      // Record stake in Firestore
      if (userProfile?.telegramId) {
        await setDoc(
          doc(db, 'users', userProfile.telegramId, 'stakes', Date.now().toString()),
          {
            tier:          tier.label,
            tonAmount:     tier.ton,
            lockDays:      tier.days,
            apy:           tier.apy,
            stakedAt:      Date.now(),
            unlockAt:      Date.now() + tier.days * 86_400_000,
            status:        'active',
            walletAddress: userWallet,
            receiveWallet,
            serverTimestamp: serverTimestamp(),
          }
        );
      }
      setMessage({ type:'success', text:`${tier.ton} TON staked for ${tier.days} days! Unlocks with ${tier.apy}% APY.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancel') || msg.includes('Cancel') || msg.includes('reject')) {
        setMessage({ type:'error', text:'Transaction cancelled.' });
      } else {
        setMessage({ type:'error', text: 'Transaction failed: ' + msg.slice(0, 80) });
      }
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div style={{padding:'0 16px 24px'}}>

      {/* Wallet connection */}
      {!userWallet ? (
        <div style={{background:'linear-gradient(145deg,rgba(212,175,55,0.08),rgba(17,17,19,0.95))',
          border:'1px solid rgba(212,175,55,0.3)',borderRadius:16,padding:20,
          marginBottom:20,textAlign:'center'}}>
          <p style={{fontSize:24,margin:'0 0 8px'}}>🔗</p>
          <p style={{color:'#D4AF37',fontSize:14,fontWeight:700,margin:'0 0 6px'}}>
            Connect TON Wallet to Stake
          </p>
          <p style={{color:'#5A6A79',fontSize:12,margin:'0 0 16px'}}>
            Staking requires a TON wallet connection
          </p>
          <div style={{display:'flex',justifyContent:'center'}}>
            <TonConnectButton/>
          </div>
        </div>
      ) : (
        <div style={{background:'rgba(79,195,247,0.06)',border:'1px solid rgba(79,195,247,0.2)',
          borderRadius:12,padding:'10px 16px',marginBottom:20,
          display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:16}}>🟢</span>
          <div style={{flex:1,minWidth:0}}>
            <p style={{color:'#4FC3F7',fontSize:10,fontWeight:700,margin:'0 0 1px'}}>WALLET CONNECTED</p>
            <p style={{color:'#7A8A99',fontSize:10,margin:0,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace'}}>
              {userWallet}
            </p>
          </div>
        </div>
      )}

      {/* Staking pool wallet info */}
      {receiveWallet && (
        <div style={{background:'rgba(26,26,29,0.6)',border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:12,padding:'10px 16px',marginBottom:20}}>
          <p style={{color:'#5A6A79',fontSize:10,fontWeight:700,margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.08em'}}>
            Staking Pool Wallet
          </p>
          <p style={{color:'#7A8A99',fontSize:10,margin:0,wordBreak:'break-all',fontFamily:'monospace'}}>
            {receiveWallet}
          </p>
        </div>
      )}

      {/* Tier selector */}
      <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
        letterSpacing:'0.1em',margin:'0 0 10px',fontWeight:700}}>Select Staking Tier</p>

      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
        {TIERS.map((t, i) => (
          <motion.button key={t.label} whileTap={{scale:0.98}}
            onClick={() => setSelected(i)}
            style={{
              textAlign:'left',width:'100%',cursor:'pointer',padding:'16px 18px',
              borderRadius:16,
              background: selected === i
                ? `linear-gradient(135deg,${t.glow.replace('0.3','0.1').replace('0.25','0.08').replace('0.2','0.07')},rgba(17,17,19,0.98))`
                : 'linear-gradient(145deg,#1A1A1D,#111113)',
              border:`2px solid ${selected === i ? t.border : 'rgba(255,255,255,0.05)'}`,
              boxShadow: selected === i ? `0 0 20px ${t.glow}` : 'none',
              display:'flex',alignItems:'center',gap:16,
            }}>
            <div style={{flexShrink:0,textAlign:'center',width:56}}>
              <p style={{color:t.color,fontSize:22,fontWeight:900,margin:'0 0 2px',lineHeight:1}}>
                {t.ton}
              </p>
              <p style={{color:t.color,fontSize:10,fontWeight:700,margin:0,opacity:0.8}}>TON</p>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{
                  color:t.color,fontSize:11,fontWeight:900,textTransform:'uppercase',
                  letterSpacing:'0.06em',background:`${t.glow}`,
                  padding:'2px 8px',borderRadius:20,
                  border:`1px solid ${t.border}`,
                }}>
                  {t.label}
                </span>
                <span style={{color:'#5A6A79',fontSize:11}}>{t.badge}</span>
              </div>
              <p style={{color:t.color,fontSize:18,fontWeight:900,margin:'0 0 2px',lineHeight:1}}>
                {t.apy}% APY
              </p>
              <p style={{color:'#5A6A79',fontSize:11,margin:0}}>
                +{((t.ton * t.apy / 100) * (t.days / 365)).toFixed(2)} TON estimated yield
              </p>
            </div>
            <div style={{flexShrink:0,width:20,height:20,borderRadius:'50%',
              border:`2px solid ${selected === i ? t.color : 'rgba(255,255,255,0.1)'}`,
              background: selected === i ? t.color : 'transparent',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {selected === i && <div style={{width:8,height:8,borderRadius:'50%',background:'#111'}}/>}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Summary */}
      <div style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
        border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:16,marginBottom:16}}>
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px',fontWeight:700}}>
          Stake Summary
        </p>
        {[
          { label:'Amount',     value:`${tier.ton} TON`,                                           color:'#E8E8E8' },
          { label:'Lock Period',value:`${tier.days} days`,                                          color:'#E8E8E8' },
          { label:'APY',        value:`${tier.apy}%`,                                               color:tier.color },
          { label:'Est. Yield', value:`+${((tier.ton * tier.apy / 100) * (tier.days / 365)).toFixed(3)} TON`, color:tier.color },
          { label:'Unlocks',    value:new Date(Date.now() + tier.days*86400000).toLocaleDateString(), color:'#5A6A79' },
        ].map(row => (
          <div key={row.label} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{color:'#5A6A79',fontSize:12}}>{row.label}</span>
            <span style={{color:row.color,fontSize:12,fontWeight:700}}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Stake button */}
      <motion.button whileTap={userWallet ? {scale:0.97} : {}}
        onClick={handleStake} disabled={!userWallet || isStaking || !receiveWallet}
        style={{
          width:'100%',padding:'16px',borderRadius:14,fontWeight:900,fontSize:16,
          cursor: userWallet && !isStaking ? 'pointer' : 'not-allowed',
          background: userWallet
            ? `linear-gradient(135deg,${tier.color}CC,${tier.color}88)`
            : 'rgba(42,42,45,0.8)',
          border:`1px solid ${userWallet ? tier.border : 'rgba(255,255,255,0.05)'}`,
          color: userWallet ? '#111' : '#5A6A79',
          boxShadow: userWallet ? `0 4px 20px ${tier.glow}` : 'none',
        }}>
        {isStaking ? 'Sending TON...' : !userWallet ? 'Connect Wallet to Stake'
          : `Stake ${tier.ton} TON — ${tier.label}`}
      </motion.button>

      <AnimatePresence>
        {message && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{marginTop:12,padding:'12px 16px',borderRadius:12,textAlign:'center',
              fontSize:12,fontWeight:600,
              background: message.type==='success' ? 'rgba(165,214,167,0.1)' : 'rgba(239,83,80,0.1)',
              border:`1px solid ${message.type==='success' ? 'rgba(165,214,167,0.3)' : 'rgba(239,83,80,0.3)'}`,
              color: message.type==='success' ? '#A5D6A7' : '#EF9A9A'}}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{color:'#2A2A2D',fontSize:10,textAlign:'center',marginTop:16}}>
        TON is sent directly to the staking pool wallet. Yields distributed at TGE.
      </p>
    </div>
  );
}
