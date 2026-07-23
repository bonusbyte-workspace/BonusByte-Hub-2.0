import { useState } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { useTasks } from '@/hooks/useTasks';
import { useReferrals, REFERRAL_REWARD } from '@/hooks/useReferrals';
import type { Referral } from '@/hooks/useReferrals';
import PageLayout from '@/components/PageLayout';

export default function WalletPage() {
  const { userProfile }  = useTelegramUser();
  const address          = useTonAddress();
  const { tasks, completed, completeTask }               = useTasks(userProfile?.telegramId ?? 'guest');
  const { referrals, total, earnings, referralLink, copyLink, copied }
                         = useReferrals(userProfile?.telegramId ?? 'guest');

  const [claiming,     setClaiming]     = useState<string | null>(null);
  const [claimed,      setClaimed]      = useState<Set<string>>(new Set());
  const [refCode,      setRefCode]      = useState('');
  const [refLoading,   setRefLoading]   = useState(false);
  const [refMsg,       setRefMsg]       = useState('');
  const [refError,     setRefError]     = useState('');

  const handleTask = async (task: typeof tasks[0]) => {
    if (task.status === 'locked' || completed.has(task.id) || claimed.has(task.id) || claiming) return;
    if (task.link) window.open(task.link, '_blank');
    setClaiming(task.id);
    const ok = await completeTask(task);
    if (ok) setClaimed(prev => new Set([...prev, task.id]));
    setClaiming(null);
  };

  // Manual referral code submission
  const submitReferral = async () => {
    const myId       = userProfile?.telegramId;
    const referrerId = refCode.trim();
    if (!myId || !referrerId) { setRefError('Enter a valid referral code.'); return; }
    if (referrerId === myId)  { setRefError("You can't refer yourself."); return; }

    const myRef = doc(db, 'users', myId);
    const mySnap = await getDoc(myRef);
    if (mySnap.exists() && mySnap.data().referrerId) {
      setRefError('You already used a referral code.');
      return;
    }

    setRefLoading(true); setRefError(''); setRefMsg('');
    try {
      // Check referrer exists
      const referrerRef  = doc(db, 'users', referrerId);
      const referrerSnap = await getDoc(referrerRef);
      if (!referrerSnap.exists()) { setRefError('Referral code not found. Ask your friend for their exact code.'); return; }

      const d = referrerSnap.data();
      // Reward referrer
      await setDoc(referrerRef, {
        balance:          (d.balance          ?? 0) + REFERRAL_REWARD,
        totalEarned:      (d.totalEarned      ?? 0) + REFERRAL_REWARD,
        referralCount:    (d.referralCount    ?? 0) + 1,
        referralEarnings: (d.referralEarnings ?? 0) + REFERRAL_REWARD,
      }, { merge: true });

      // Record referral
      await setDoc(doc(db, 'users', referrerId, 'referrals', myId), {
        telegramId: myId,
        username:   userProfile?.username   ?? '',
        firstName:  userProfile?.firstName  ?? 'Player',
        joinedAt:   Date.now(),
        reward:     REFERRAL_REWARD,
        status:     'rewarded',
        serverTimestamp: serverTimestamp(),
      });

      // Mark this user as referred
      await setDoc(myRef, { referrerId }, { merge: true });

      setRefMsg(`Success! Your friend earned ${REFERRAL_REWARD.toLocaleString()} BB.`);
      setRefCode('');
    } catch (err: unknown) {
      setRefError(err instanceof Error ? err.message : 'Failed. Try again.');
    } finally {
      setRefLoading(false);
    }
  };

  const slots = [...tasks, ...Array(Math.max(0, 3 - tasks.length)).fill(null)].slice(0, Math.max(3, tasks.length));

  return (
    <PageLayout title="Wallet & Tasks" subtitle="Connect TON wallet, earn referrals and complete tasks">
      <div style={{padding:'0 16px'}}>

        {/* ── TON Wallet ── */}
        <div style={{background:'linear-gradient(145deg,#1A1A1D,#111113)',
          border:'1px solid rgba(192,192,192,0.1)',borderRadius:16,padding:18,marginBottom:20}}>
          <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
            letterSpacing:'0.1em',margin:'0 0 12px',fontWeight:700}}>TON Wallet</p>
          <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
            <TonConnectButton/>
          </div>
          {address ? (
            <div style={{background:'rgba(79,195,247,0.06)',border:'1px solid rgba(79,195,247,0.15)',
              borderRadius:10,padding:'8px 12px'}}>
              <p style={{color:'#4FC3F7',fontSize:10,margin:'0 0 2px',fontWeight:700}}>CONNECTED</p>
              <p style={{color:'#7A8A99',fontSize:10,margin:0,wordBreak:'break-all',fontFamily:'monospace'}}>
                {address}
              </p>
            </div>
          ) : (
            <p style={{color:'#3A3A45',fontSize:11,textAlign:'center',margin:0}}>
              Connect to link staking rewards and receive airdrops
            </p>
          )}
        </div>

        {/* ── Referral Program ── */}
        <div style={{background:'linear-gradient(135deg,rgba(212,175,55,0.08),rgba(17,17,19,0.98))',
          border:'1px solid rgba(212,175,55,0.25)',borderRadius:16,padding:18,marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div>
              <p style={{color:'#D4AF37',fontSize:10,textTransform:'uppercase',
                letterSpacing:'0.1em',margin:'0 0 4px',fontWeight:700}}>Referral Program</p>
              <p style={{color:'#5A6A79',fontSize:11,margin:0}}>
                Earn {REFERRAL_REWARD.toLocaleString()} BB per friend who joins
              </p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{color:'#D4AF37',fontSize:22,fontWeight:900,margin:'0 0 1px',lineHeight:1}}>
                {total}
              </p>
              <p style={{color:'#5A6A79',fontSize:9,margin:0}}>referrals</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
            {[
              { label:'Friends Invited', value: total.toString(),               color:'#D4AF37' },
              { label:'BB Earned',       value: earnings.toLocaleString()+' BB', color:'#A5D6A7' },
            ].map(s => (
              <div key={s.label} style={{background:'rgba(0,0,0,0.3)',borderRadius:10,
                padding:'10px 12px',textAlign:'center'}}>
                <p style={{color:s.color,fontSize:18,fontWeight:900,margin:'0 0 2px',lineHeight:1}}>{s.value}</p>
                <p style={{color:'#5A6A79',fontSize:10,margin:0}}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Your referral link */}
          {referralLink && (<>
            <div style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(212,175,55,0.15)',
              borderRadius:10,padding:'8px 12px',marginBottom:8}}>
              <p style={{color:'#5A6A79',fontSize:9,margin:'0 0 3px',textTransform:'uppercase',
                letterSpacing:'0.06em'}}>YOUR REFERRAL LINK</p>
              <p style={{color:'#7A8A99',fontSize:10,margin:0,wordBreak:'break-all',fontFamily:'monospace'}}>
                {referralLink}
              </p>
            </div>
            <button onClick={copyLink} style={{width:'100%',padding:'12px',borderRadius:12,fontWeight:700,
              fontSize:13,cursor:'pointer',border:'none',transition:'all 0.2s',
              background: copied
                ? 'linear-gradient(135deg,rgba(165,214,167,0.3),rgba(165,214,167,0.15))'
                : 'linear-gradient(135deg,#D4AF37CC,#D4AF3799)',
              color: copied ? '#A5D6A7' : '#111'}}>
              {copied ? 'Link Copied + Shared!' : 'Copy & Share Referral Link'}
            </button>
          </>)}

          {/* Manual referral code input */}
          <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,175,55,0.1)'}}>
            <p style={{color:'#5A6A79',fontSize:10,margin:'0 0 8px',fontWeight:600}}>
              Got a referral code from a friend?
            </p>
            <div style={{display:'flex',gap:8}}>
              <input
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                placeholder="Enter their Telegram ID"
                style={{flex:1,background:'rgba(0,0,0,0.4)',border:'1px solid rgba(212,175,55,0.2)',
                  borderRadius:10,padding:'9px 12px',color:'#E8E8E8',fontSize:12,outline:'none',
                  WebkitUserSelect:'auto',touchAction:'auto'}}/>
              <button onClick={submitReferral} disabled={refLoading || !refCode.trim()}
                style={{padding:'0 16px',borderRadius:10,border:'none',fontWeight:700,fontSize:12,
                  cursor: refCode.trim() ? 'pointer' : 'not-allowed',
                  background: refCode.trim() ? 'rgba(212,175,55,0.8)' : 'rgba(42,42,45,0.8)',
                  color: refCode.trim() ? '#111' : '#5A6A79',flexShrink:0}}>
                {refLoading ? '...' : 'Apply'}
              </button>
            </div>
            {refMsg   && <p style={{color:'#A5D6A7',fontSize:11,margin:'6px 0 0'}}>{refMsg}</p>}
            {refError && <p style={{color:'#EF9A9A',fontSize:11,margin:'6px 0 0'}}>{refError}</p>}
            <p style={{color:'#3A3A45',fontSize:9,margin:'6px 0 0'}}>
              The code is your friend's Telegram ID number — they can find it in their referral link.
            </p>
          </div>

          {/* Referral history */}
          {referrals.length > 0 && (
            <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,175,55,0.1)'}}>
              <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
                letterSpacing:'0.08em',margin:'0 0 8px',fontWeight:700}}>
                Friends Invited
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {referrals.slice(0,5).map((r: Referral) => (
                  <div key={r.telegramId} style={{display:'flex',alignItems:'center',
                    justifyContent:'space-between',padding:'8px 10px',
                    background:'rgba(0,0,0,0.3)',borderRadius:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:8,
                        background:'rgba(212,175,55,0.1)',flexShrink:0,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:12,fontWeight:700,color:'#D4AF37'}}>
                        {(r.firstName?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <p style={{color:'#D0D0D0',fontSize:12,fontWeight:600,margin:'0 0 1px'}}>
                          {r.firstName}{r.username ? ` @${r.username}` : ''}
                        </p>
                        <p style={{color:'#3A3A45',fontSize:10,margin:0}}>
                          {new Date(r.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p style={{color:'#A5D6A7',fontSize:12,fontWeight:700,margin:0}}>
                      +{(r.reward ?? 0).toLocaleString()} BB
                    </p>
                  </div>
                ))}
                {referrals.length > 5 && (
                  <p style={{color:'#3A3A45',fontSize:10,textAlign:'center',margin:'4px 0 0'}}>
                    +{referrals.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Tasks ── */}
        <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
          letterSpacing:'0.1em',margin:'0 0 12px',fontWeight:700}}>Tasks</p>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {slots.map((task, i) => {
            if (!task) return (
              <div key={'empty-'+i} style={{background:'rgba(17,17,19,0.5)',
                border:'1px dashed rgba(255,255,255,0.05)',borderRadius:16,
                padding:'18px 20px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:'#0A0A0D',
                  display:'flex',alignItems:'center',justifyContent:'center',opacity:0.3,fontSize:20}}>
                  🔒
                </div>
                <div>
                  <p style={{color:'#2A2A2D',fontSize:13,fontWeight:700,margin:'0 0 3px'}}>No task yet</p>
                  <p style={{color:'#1A1A1D',fontSize:11,margin:0}}>Developer will post soon</p>
                </div>
              </div>
            );
            const isLocked  = task.status === 'locked';
            const isDone    = completed.has(task.id) || claimed.has(task.id);
            const isLoading = claiming === task.id;
            return (
              <button key={task.id} onClick={() => handleTask(task)}
                disabled={isLocked || isDone || !!claiming}
                style={{width:'100%',textAlign:'left',cursor: isLocked || isDone ? 'default' : 'pointer',
                  background: isDone
                    ? 'linear-gradient(145deg,rgba(165,214,167,0.07),rgba(17,17,19,0.95))'
                    : isLocked ? 'rgba(17,17,19,0.5)'
                    : 'linear-gradient(145deg,rgba(79,195,247,0.06),rgba(17,17,19,0.98))',
                  border:`1px solid ${isDone?'rgba(165,214,167,0.25)':isLocked?'rgba(255,255,255,0.04)':'rgba(79,195,247,0.18)'}`,
                  borderRadius:16,padding:'16px 18px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
                  background:isDone?'rgba(165,214,167,0.1)':isLocked?'rgba(26,26,29,0.8)':'rgba(79,195,247,0.08)',
                  filter:isLocked?'grayscale(1) brightness(0.4)':'none'}}>
                  {isDone ? 'done' : isLocked ? 'lock' : task.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:isDone?'#A5D6A7':isLocked?'#2A2A2D':'#D0D0D0',
                    fontSize:13,fontWeight:700,margin:'0 0 3px',
                    filter:isLocked?'blur(5px)':'none',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {isLocked ? 'Hidden task' : task.title}
                  </p>
                  <p style={{color:'#5A6A79',fontSize:11,margin:0}}>
                    {isDone?'Completed':isLocked?'Locked':task.description}
                  </p>
                </div>
                {!isLocked && (
                  <div style={{flexShrink:0,textAlign:'right'}}>
                    <p style={{fontSize:15,fontWeight:900,margin:'0 0 2px',
                      color:isDone?'#A5D6A7':'#FFD700'}}>
                      +{task.reward.toLocaleString()}
                    </p>
                    <p style={{color:'#3A3A45',fontSize:9,margin:0}}>
                      {isLoading?'claiming...':'BB'}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p style={{color:'#2A2A2D',fontSize:10,textAlign:'center',marginTop:20,paddingBottom:8}}>
          Invite friends to earn {REFERRAL_REWARD.toLocaleString()} BB per referral
        </p>
      </div>
    </PageLayout>
  );
}
