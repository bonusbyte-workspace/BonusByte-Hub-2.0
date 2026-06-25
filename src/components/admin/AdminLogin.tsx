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
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(192,192,192,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(192,192,192,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1     }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm mx-4 chrome-surface rounded-2xl p-6"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="BonusByte" className="w-14 h-14 object-contain opacity-80" />
        </div>

        <h1 className="chrome-text text-xl font-black text-center mb-1">
          BonusByte Admin
        </h1>
        <p className="text-steel-400 text-xs text-center mb-6 tracking-widest uppercase">
          Authorized Access Only
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-steel-400 text-xs uppercase tracking-widest block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@bonusbyte.io"
              className="w-full bg-obsidian-900 border border-obsidian-600 rounded-lg px-4 py-2.5 text-chrome-200 text-sm outline-none focus:border-chrome-500 transition-colors"
              style={{ touchAction: 'auto', userSelect: 'auto' }}
            />
          </div>

          <div>
            <label className="text-steel-400 text-xs uppercase tracking-widest block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••••"
              className="w-full bg-obsidian-900 border border-obsidian-600 rounded-lg px-4 py-2.5 text-chrome-200 text-sm outline-none focus:border-chrome-500 transition-colors"
              style={{ touchAction: 'auto', userSelect: 'auto' }}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs text-center bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full chrome-button py-3 rounded-xl font-black text-obsidian-900 text-sm tracking-wide mt-2"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-obsidian-700 text-[10px] text-center mt-5">
          BonusByte Control Panel v2.0
        </p>
      </motion.div>
    </div>
  );
}
