import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLogin() {
  const { login, isLoading, error } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email.trim(), password);
  };

  return (
    <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',
      justifyContent:'center',background:'#000',padding:'0 16px'}}>

      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
        style={{width:'100%',maxWidth:360,background:'linear-gradient(145deg,#1A1A1D,#111113)',
          border:'1px solid rgba(192,192,192,0.15)',borderRadius:16,padding:24}}>

        <div style={{display:'flex',justifyContent:'center',marginBottom:20}}>
          <img src="/logo.png" alt="" style={{width:48,height:48,objectFit:'contain',opacity:0.85}}/>
        </div>

        <h1 style={{textAlign:'center',fontSize:18,fontWeight:900,marginBottom:4,
          background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          BonusByte Admin
        </h1>
        <p style={{textAlign:'center',color:'#5A6A79',fontSize:10,letterSpacing:'0.1em',
          textTransform:'uppercase',marginBottom:24,marginTop:0}}>
          Authorized Access Only
        </p>

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
              letterSpacing:'0.08em',margin:'0 0 6px'}}>Email</p>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              required autoComplete="email" placeholder="admin@example.com"
              style={{width:'100%',background:'#0A0A0D',border:'1px solid #2A2A2D',
                borderRadius:8,padding:'10px 14px',color:'#E8E8E8',fontSize:13,
                outline:'none',boxSizing:'border-box',
                WebkitUserSelect:'auto', touchAction:'auto'}}/>
          </div>

          <div>
            <p style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
              letterSpacing:'0.08em',margin:'0 0 6px'}}>Password</p>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••"
              style={{width:'100%',background:'#0A0A0D',border:'1px solid #2A2A2D',
                borderRadius:8,padding:'10px 14px',color:'#E8E8E8',fontSize:13,
                outline:'none',boxSizing:'border-box',
                WebkitUserSelect:'auto', touchAction:'auto'}}/>
          </div>

          {error && (
            <div style={{background:'rgba(239,83,80,0.08)',border:'1px solid rgba(239,83,80,0.3)',
              borderRadius:8,padding:'10px 14px'}}>
              <p style={{color:'#EF9A9A',fontSize:11,margin:0,lineHeight:1.5,
                wordBreak:'break-word'}}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading || !email || !password}
            style={{
              width:'100%',padding:'12px',borderRadius:10,marginTop:4,
              border:'1px solid rgba(200,200,200,0.3)',
              background: (isLoading || !email || !password)
                ? '#2A2A2D'
                : 'linear-gradient(180deg,#D0D0D0 0%,#9A9A9A 40%,#7A7A7A 60%,#B8B8B8 100%)',
              fontWeight:900,fontSize:14,cursor:'pointer',
              color: (isLoading || !email || !password) ? '#5A6A79' : '#111',
            }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{color:'#2A2A2D',fontSize:10,textAlign:'center',marginTop:16,marginBottom:0}}>
          v2.0 · Control Panel
        </p>
      </motion.div>
    </div>
  );
}
