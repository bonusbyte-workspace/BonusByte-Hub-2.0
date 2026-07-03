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
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(192,192,192,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(192,192,192,0.3) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background:'linear-gradient(145deg,#1A1A1D,#111113)', border:'1px solid rgba(192,192,192,0.15)' }}
      >
        <div className="flex justify-center mb-5">
          <img src="/logo.png" alt="BonusByte" className="w-12 h-12 object-contain opacity-80" />
        </div>
        <h1 style={{
          textAlign:'center', fontSize:20, fontWeight:900, marginBottom:4,
          background:'linear-gradient(135deg,#8C8C8C 0%,#E8E8E8 50%,#9A9A9A 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
        }}>
          BonusByte Admin
        </h1>
        <p style={{textAlign:'center',color:'#5A6A79',fontSize:10,letterSpacing:'0.1em',
          textTransform:'uppercase',marginBottom:20}}>
          Authorized Access Only
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
              letterSpacing:'0.08em',display:'block',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              required autoComplete="email" placeholder="admin@bonusbyte.io"
              style={{width:'100%',background:'#0A0A0D',border:'1px solid #242428',
                borderRadius:8,padding:'10px 14px',color:'#E8E8E8',fontSize:13,
                outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
              letterSpacing:'0.08em',display:'block',marginBottom:6}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••••"
              style={{width:'100%',background:'#0A0A0D',border:'1px solid #242428',
                borderRadius:8,padding:'10px 14px',color:'#E8E8E8',fontSize:13,
                outline:'none',boxSizing:'border-box'}}/>
          </div>

          {error && (
            <div style={{background:'rgba(239,83,80,0.1)',border:'1px solid rgba(239,83,80,0.3)',
              borderRadius:8,padding:'10px 14px'}}>
              <p style={{color:'#EF5350',fontSize:12,textAlign:'center',margin:0}}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading || !email || !password}
            style={{
              width:'100%',padding:'12px',borderRadius:10,border:'1px solid rgba(200,200,200,0.3)',
              background:'linear-gradient(180deg,#D0D0D0 0%,#9A9A9A 40%,#7A7A7A 60%,#B8B8B8 100%)',
              fontWeight:900,fontSize:14,cursor:'pointer',color:'#111',marginTop:4,
              opacity: (isLoading || !email || !password) ? 0.5 : 1,
            }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{color:'#333',fontSize:10,textAlign:'center',marginTop:16}}>
          v2.0 · BonusByte Control Panel
        </p>
      </motion.div>
    </div>
  );
}
