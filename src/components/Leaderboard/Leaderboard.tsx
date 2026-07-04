import { useLeaderboard } from '@/hooks/useLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import type { LeaderboardEntry } from '@/models/types';

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{fontSize:20,filter:'drop-shadow(0 0 6px rgba(255,215,0,0.6))'}}>🥇</span>;
  if (rank === 2) return <span style={{fontSize:20,filter:'drop-shadow(0 0 6px rgba(192,192,192,0.5))'}}>🥈</span>;
  if (rank === 3) return <span style={{fontSize:20,filter:'drop-shadow(0 0 6px rgba(205,127,50,0.5))'}}>🥉</span>;
  return <span style={{color:'#5A6A79',fontSize:12,fontWeight:700,width:22,textAlign:'center',display:'inline-block'}}>{rank}</span>;
}

function PlayerRow({ entry, index, myId }: { entry: LeaderboardEntry; index: number; myId?: string }) {
  const isMe = entry.telegramId === myId;
  return (
    <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:index*0.03}}
      style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',marginBottom:8,
        borderRadius:14,
        background: isMe
          ? 'linear-gradient(135deg,rgba(79,195,247,0.08),rgba(17,17,19,0.95))'
          : 'linear-gradient(145deg,#1A1A1D,#111113)',
        border:`1px solid ${isMe ? 'rgba(79,195,247,0.3)' : 'rgba(255,255,255,0.05)'}`,
      }}>
      <div style={{width:28,display:'flex',justifyContent:'center',flexShrink:0}}>
        <Medal rank={entry.rank}/>
      </div>
      <div style={{width:38,height:38,borderRadius:10,flexShrink:0,
        display:'flex',alignItems:'center',justifyContent:'center',
        background:'linear-gradient(135deg,#1A1A1D,#2A2A2D)',
        border:'1px solid rgba(192,192,192,0.1)',
        fontSize:15,fontWeight:700,color:'#9A9A9A'}}>
        {(entry.firstName?.[0] ?? entry.username?.[0] ?? '?').toUpperCase()}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{color:isMe?'#4FC3F7':'#D0D0D0',fontSize:13,fontWeight:700,
          margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {entry.firstName || entry.username || 'Player'}{isMe ? ' (you)' : ''}
        </p>
        {entry.username && <p style={{color:'#5A6A79',fontSize:10,margin:0}}>@{entry.username}</p>}
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <p style={{fontSize:14,fontWeight:900,margin:'0 0 2px',
          background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {entry.totalEarned.toLocaleString()}
        </p>
        <p style={{color:'#5A6A79',fontSize:9,margin:0}}>BB coins</p>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { entries, isLoading, error, filter, setFilter, updatedAt } = useLeaderboard();
  const { userProfile } = useTelegramUser();

  return (
    <div style={{padding:'0 16px'}}>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        {(['all-time','daily'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{padding:'7px 18px',borderRadius:20,fontSize:12,fontWeight:700,
              cursor:'pointer',border:'none',transition:'all 0.15s',
              background: filter===f ? 'linear-gradient(180deg,#D0D0D0,#9A9A9A)' : 'rgba(26,26,29,0.8)',
              color: filter===f ? '#111' : '#5A6A79',
              boxShadow: filter===f ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'}}>
            {f === 'all-time' ? 'All Time' : 'Today'}
          </button>
        ))}
        {updatedAt && <p style={{color:'#3A3A45',fontSize:10,margin:'0 0 0 auto'}}>
          {new Date(updatedAt).toLocaleTimeString()}
        </p>}
      </div>

      {isLoading ? (
        Array.from({length:8}).map((_,i) => (
          <div key={i} style={{height:62,borderRadius:14,marginBottom:8,
            background:'rgba(26,26,29,0.6)',opacity:1-i*0.1}}/>
        ))
      ) : error ? (
        <p style={{color:'#5A6A79',fontSize:13,textAlign:'center',padding:'40px 0'}}>{error}</p>
      ) : entries.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0'}}>
          <p style={{fontSize:32,margin:'0 0 12px'}}>🏆</p>
          <p style={{color:'#5A6A79',fontSize:14,margin:0}}>No players yet — start tapping!</p>
        </div>
      ) : (
        <AnimatePresence>
          {entries.map((e,i) => <PlayerRow key={e.telegramId} entry={e} index={i} myId={userProfile?.telegramId}/>)}
        </AnimatePresence>
      )}
    </div>
  );
}
