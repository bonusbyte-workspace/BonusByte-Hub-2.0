import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdminUser } from '@/models/types';

interface Props { adminUser: AdminUser; }
interface Message {
  id: string; telegramId: string; username: string; firstName: string;
  text: string; date: number; status: 'new' | 'read' | 'replied'; chatId: number;
}

export default function SupportModule({ adminUser: _a }: Props) {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [filter, setFilter]         = useState<'all'|'new'|'read'>('all');

  useEffect(() => {
    const q = query(collection(db, 'support_messages'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return unsub;
  }, []);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'support_messages', id), { status: 'read' });
  };

  const openTelegram = (chatId: number, username: string) => {
    const url = username
      ? `https://t.me/${username}`
      : `https://t.me/c/${chatId}`;
    window.open(url, '_blank');
  };

  const filtered = messages.filter(m => filter === 'all' || m.status === filter);
  const newCount  = messages.filter(m => m.status === 'new').length;

  return (
    <div style={{padding:16}}>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
        {[
          { label:'Total',    value: messages.length,                                 color:'#E8E8E8' },
          { label:'New',      value: newCount,                                        color:'#EF9A9A' },
          { label:'Resolved', value: messages.filter(m=>m.status==='replied').length, color:'#A5D6A7' },
        ].map(s => (
          <div key={s.label} style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px'}}>
            <p style={{color:'#5A6A79',fontSize:9,textTransform:'uppercase',margin:'0 0 2px'}}>{s.label}</p>
            <p style={{color:s.color,fontSize:18,fontWeight:900,margin:0}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:6,marginBottom:12}}>
        {(['all','new','read'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:600,
              cursor:'pointer',border:'none',
              background: filter===f ? 'linear-gradient(180deg,#D0D0D0,#9A9A9A)' : 'rgba(26,26,29,0.8)',
              color: filter===f ? '#111' : '#5A6A79'}}>
            {f.charAt(0).toUpperCase()+f.slice(1)} {f==='new'&&newCount>0?`(${newCount})`:''}
          </button>
        ))}
      </div>

      {/* Setup instructions if no messages */}
      {!isLoading && messages.length === 0 && (
        <div style={{background:'linear-gradient(145deg,#141416,#0F0F11)',
          border:'1px solid rgba(79,195,247,0.2)',borderRadius:12,padding:16,marginBottom:12}}>
          <p style={{color:'#4FC3F7',fontSize:12,fontWeight:700,margin:'0 0 8px'}}>
            Bot Setup Required
          </p>
          <p style={{color:'#5A6A79',fontSize:11,margin:'0 0 8px',lineHeight:1.6}}>
            To receive messages here, set the Telegram webhook by opening this URL once:
          </p>
          <p style={{color:'#9A9A9A',fontSize:10,margin:0,wordBreak:'break-all',fontFamily:'monospace',
            background:'#0A0A0D',padding:'8px 10px',borderRadius:6}}>
            https://api.telegram.org/bot8707895102:AAF_K22dEYEuUh4sQT6ww8xGXTFaR6ve0iU/setWebhook?url=https://bonus-byte-hub-2-0.vercel.app/api/webhook
          </p>
          <p style={{color:'#3A3A45',fontSize:10,margin:'8px 0 0'}}>
            After setting, users who message @BonusByte_Bot will appear here.
          </p>
        </div>
      )}

      {/* Messages list */}
      {isLoading ? (
        <p style={{color:'#5A6A79',fontSize:12,textAlign:'center',padding:'20px 0'}}>Loading...</p>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {filtered.map(msg => (
            <div key={msg.id}
              onClick={() => { setSelected(selected===msg.id ? null : msg.id); if(msg.status==='new') markRead(msg.id); }}
              style={{
                background:'linear-gradient(145deg,#141416,#0F0F11)',
                border:`1px solid ${msg.status==='new' ? 'rgba(239,154,154,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius:12,padding:'12px 14px',cursor:'pointer',
              }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    {msg.status === 'new' && (
                      <span style={{width:6,height:6,borderRadius:'50%',background:'#EF5350',flexShrink:0,display:'inline-block'}}/>
                    )}
                    <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,margin:0}}>
                      {msg.firstName} {msg.username ? '@'+msg.username : ''}
                    </p>
                    <p style={{color:'#3A3A45',fontSize:10,margin:0,marginLeft:'auto',flexShrink:0}}>
                      {new Date(msg.date).toLocaleString()}
                    </p>
                  </div>
                  <p style={{color:'#9A9A9A',fontSize:12,margin:0,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace: selected===msg.id ? 'normal' : 'nowrap'}}>
                    {msg.text}
                  </p>
                </div>
              </div>

              {/* Expanded actions */}
              {selected === msg.id && (
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.06)',
                  display:'flex',gap:8}}>
                  <button
                    onClick={e => { e.stopPropagation(); openTelegram(msg.chatId, msg.username); }}
                    style={{flex:1,padding:'8px',borderRadius:8,fontSize:11,fontWeight:700,
                      cursor:'pointer',border:'none',
                      background:'rgba(79,195,247,0.15)',color:'#4FC3F7'}}>
                    Reply on Telegram
                  </button>
                  <button
                    onClick={async e => { e.stopPropagation(); await updateDoc(doc(db,'support_messages',msg.id),{status:'replied'}); }}
                    style={{flex:1,padding:'8px',borderRadius:8,fontSize:11,fontWeight:700,
                      cursor:'pointer',border:'none',
                      background:'rgba(165,214,167,0.15)',color:'#A5D6A7'}}>
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <p style={{color:'#3A3A45',fontSize:12,textAlign:'center',padding:'20px 0'}}>
              No {filter === 'all' ? '' : filter} messages
            </p>
          )}
        </div>
      )}
    </div>
  );
}
