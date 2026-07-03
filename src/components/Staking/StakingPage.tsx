import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { STAKE_PERIODS } from '@/models/types';
import type { LockDays } from '@/models/types';

interface Props {
  telegramId: string;
  balance:    number;
  onStaked:   (newBalance: number) => void;
}

const COLORS: Record<number, { border: string; text: string; glow: string }> = {
  7:  { border:'rgba(205,127,50,0.45)',  text:'#CD7F32', glow:'rgba(205,127,50,0.2)' },
  30: { border:'rgba(192,192,192,0.45)', text:'#C0C0C0', glow:'rgba(192,192,192,0.15)' },
  90: { border:'rgba(212,175,55,0.55)',  text:'#D4AF37', glow:'rgba(212,175,55,0.25)' },
};

export default function StakingPage({ telegramId, balance, onStaked }: Props) {
  const [selectedDays, setSelectedDays] = useState<LockDays>(30);
  const [amount,       setAmount]       = useState('');
  const [isStaking,    setIsStaking]    = useState(false);
  const [message,      setMessage]      = useState<{type:'success'|'error',text:string}|null>(null);
  const [receiveWallet, setReceiveWallet] = useState<string>('');
  const [tonConnectUI]  = useTonConnectUI();
  const userWallet      = useTonAddress();

  // Load developer's TON receive wallet from Firestore
  useEffect(() => {
    getDoc(doc(db, 'config', 'economy')).then(snap => {
      if (snap.exists() && snap.data().stakingWallet) {
        setReceiveWallet(snap.data().stakingWallet as string);
      }
    }).catch(() => {});
  }, []);

  const selected  = STAKE_PERIODS.find(p => p.days === selectedDays)!;
  const amountNum = parseFloat(amount) || 0;
  const yieldAmt  = amountNum * (selected.apy / 100) * (selectedDays / 365);
  const isValid   = amountNum > 0 && amountNum <= balance;

  const handleStake = useCallback(async () => {
    if (!isValid || isStaking) return;
    setIsStaking(true);
    setMessage(null);

    try {
      // Deduct BB coins from Firestore
      const userRef = doc(db, 'users', telegramId);
      const snap    = await getDoc(userRef);
      if (!snap.exists()) throw new Error('User not found');
      const cur = snap.data().balance ?? 0;
      if (cur < amountNum) throw new Error('Insufficient balance');
      const newBalance = cur - amountNum;

      // Record stake
      const stakeRef = doc(db, 'users', telegramId, 'stakes', Date.now().toString());
      await setDoc(stakeRef, {
        amount:     amountNum,
        lockDays:   selectedDays,
        apy:        selected.apy,
        stakedAt:   Date.now(),
        unlockAt:   Date.now() + selectedDays * 86400000,
        status:     'active',
        projectedYield: yieldAmt,
        walletAddress: userWallet || null,
        serverTimestamp: serverTimestamp(),
      });

      // Update user balance
      await setDoc(userRef, { balance: newBalance }, { merge: true });
      onStaked(newBalance);
      setAmount('');

      // If TON wallet connected and receive wallet set, send TON
      if (userWallet && receiveWallet) {
        try {
          const tonAmount = Math.round(amountNum * 0.001 * 1e9); // 0.001 TON per BB coin
          if (tonAmount >= 10000000) { // min 0.01 TON
            await tonConnectUI.sendTransaction({
              validUntil: Math.floor(Date.now() / 1000) + 600,
              messages: [{
                address: receiveWallet,
                amount:  tonAmount.toString(),
                payload: btoa('BonusByte Stake ' + selectedDays + 'd'),
              }],
            });
            setMessage({ type: 'success', text: 'Staked! TON sent to staking pool. Unlocks in ' + selectedDays + ' days.' });
          } else {
            setMessage({ type: 'success', text: 'BB coins staked! Connect TON wallet for full staking benefits. Unlocks in ' + selectedDays + ' days.' });
          }
        } catch {
          setMessage({ type: 'success', text: 'BB coins staked successfully! Unlocks in ' + selectedDays + ' days.' });
        }
      } else {
        setMessage({ type: 'success', text: 'Staked! Connect TON wallet to send TON to the staking pool.' });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Staking failed.' });
    } finally {
      setIsStaking(false);
    }
  }, [isValid, isStaking, telegramId, amountNum, selectedDays, selected.apy, yieldAmt, userWallet, receiveWallet, onStaked, tonConnectUI]);

  return (
    <div style={{flex:1,overflowY:'auto',padding:'max(48px,calc(env(safe-area-inset-top,0px)+48px)) 16px 100px'}}>

      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:900,margin:'0 0 4px',
          background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Pre-Launch Staking
        </h2>
        <p style={{color:'#5A6A79',fontSize:12,margin:0}}>
          Lock coins before TGE to earn guaranteed yields
        </p>
      </div>

      {/* Balance */}
      <div style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
        border:'1px solid rgba(192,192,192,0.1)',borderRadius:14,padding:16,marginBottom:16}}>
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 4px'}}>
          Available Balance
        </p>
        <p style={{fontSize:22,fontWeight:900,margin:0,
          background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {balance.toLocaleString()} BB
        </p>
      </div>

      {/* Receive wallet notice */}
      {receiveWallet && (
        <div style={{background:'rgba(79,195,247,0.06)',border:'1px solid rgba(79,195,247,0.2)',
          borderRadius:12,padding:'10px 14px',marginBottom:16}}>
          <p style={{color:'#4FC3F7',fontSize:10,margin:'0 0 2px',fontWeight:700}}>
            STAKING POOL WALLET
          </p>
          <p style={{color:'#7A8A99',fontSize:10,margin:0,wordBreak:'break-all',fontFamily:'monospace'}}>
            {receiveWallet}
          </p>
        </div>
      )}

      {/* Period selector */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
        {STAKE_PERIODS.map(period => {
          const c      = COLORS[period.days];
          const active = period.days === selectedDays;
          return (
            <motion.button key={period.days} whileTap={{scale:0.96}}
              onClick={() => setSelectedDays(period.days)}
              style={{
                background: active ? 'linear-gradient(145deg,rgba(79,195,247,0.05),rgba(17,17,19,0.98))' : 'rgba(17,17,19,0.9)',
                border:`1px solid ${active ? c.border : 'rgba(255,255,255,0.07)'}`,
                borderRadius:12,padding:12,textAlign:'center',cursor:'pointer',
                boxShadow: active ? `0 0 16px ${c.glow}` : 'none',
              }}>
              <p style={{color:c.text,fontSize:10,fontWeight:700,margin:'0 0 2px'}}>{period.badge}</p>
              <p style={{color:'#E8E8E8',fontSize:18,fontWeight:900,lineHeight:1,margin:'0 0 2px'}}>{period.days}d</p>
              <p style={{color:c.text,fontSize:11,fontWeight:700,margin:0}}>{period.apy}% APY</p>
            </motion.button>
          );
        })}
      </div>

      {/* Amount input */}
      <div style={{marginBottom:16}}>
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 8px'}}>
          Amount to Stake
        </p>
        <div style={{display:'flex',gap:8}}>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0" min="1" max={balance}
            style={{flex:1,background:'#111113',border:'1px solid #2A2A2D',borderRadius:12,
              padding:'12px 16px',color:'#E8E8E8',fontSize:18,fontWeight:700,outline:'none',
              WebkitUserSelect:'auto',touchAction:'auto'}}/>
          <button onClick={() => setAmount(String(Math.floor(balance)))}
            style={{background:'linear-gradient(180deg,#D0D0D0,#9A9A9A)',
              border:'1px solid rgba(200,200,200,0.3)',borderRadius:12,
              padding:'0 16px',fontWeight:700,fontSize:13,cursor:'pointer',color:'#111'}}>
            MAX
          </button>
        </div>
      </div>

      {/* Yield preview */}
      {amountNum > 0 && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
            border:'1px solid rgba(192,192,192,0.1)',borderRadius:14,padding:16,marginBottom:16}}>
          <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>
            Projected Returns
          </p>
          {[
            { label:'Staked',    value: amountNum.toLocaleString() + ' BB', color:'#E8E8E8' },
            { label:`Yield (${selected.apy}% APY)`, value:'+' + yieldAmt.toFixed(2) + ' BB', color:COLORS[selectedDays].text },
            { label:'Total return', value:(amountNum + yieldAmt).toFixed(2) + ' BB', color:'#E8E8E8' },
          ].map(row => (
            <div key={row.label} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{color:'#5A6A79',fontSize:12}}>{row.label}</span>
              <span style={{color:row.color,fontSize:12,fontWeight:700}}>{row.value}</span>
            </div>
          ))}
          <div style={{height:1,background:'#1A1A1D',margin:'8px 0'}}/>
          <p style={{color:'#3A3A45',fontSize:10,textAlign:'center',margin:0}}>
            Unlocks after {selectedDays} days · TGE rewards distributed to wallet
          </p>
        </motion.div>
      )}

      {/* TON wallet prompt */}
      {!userWallet && (
        <div style={{background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.2)',
          borderRadius:12,padding:'10px 14px',marginBottom:16,textAlign:'center'}}>
          <p style={{color:'#D4AF37',fontSize:11,margin:'0 0 8px',fontWeight:600}}>
            Connect TON Wallet to send TON to staking pool
          </p>
          <div style={{display:'flex',justifyContent:'center'}}>
            <TonConnectButton/>
          </div>
        </div>
      )}

      {/* Stake button */}
      <motion.button whileTap={isValid ? {scale:0.97} : {}}
        onClick={handleStake} disabled={!isValid || isStaking}
        style={{
          width:'100%',padding:'16px',borderRadius:14,fontWeight:900,fontSize:16,cursor:'pointer',
          background: isValid
            ? 'linear-gradient(180deg,#D0D0D0 0%,#9A9A9A 40%,#7A7A7A 60%,#B8B8B8 100%)'
            : 'rgba(42,42,45,0.8)',
          border:`1px solid ${isValid ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.05)'}`,
          color: isValid ? '#111' : '#5A6A79',
        }}>
        {isStaking ? 'Staking...' : `Stake for ${selectedDays} Days`}
      </motion.button>

      <AnimatePresence>
        {message && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{marginTop:12,padding:'12px 16px',borderRadius:12,textAlign:'center',fontSize:12,fontWeight:600,
              background: message.type === 'success' ? 'rgba(165,214,167,0.1)' : 'rgba(239,83,80,0.1)',
              border:`1px solid ${message.type === 'success' ? 'rgba(165,214,167,0.3)' : 'rgba(239,83,80,0.3)'}`,
              color: message.type === 'success' ? '#A5D6A7' : '#EF9A9A'}}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
