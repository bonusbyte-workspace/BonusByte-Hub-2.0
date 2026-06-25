import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAKE_PERIODS } from '@/models/types';
import type { LockDays, StakePayload, StakeResponse } from '@/models/types';
import { getInitData } from '@/lib/telegram';

interface StakingPageProps {
  telegramId: string;
  balance:    number;
  onStaked:   (newBalance: number) => void;
}

const PERIOD_COLORS: Record<LockDays, { border: string; glow: string; badge: string }> = {
  7:  { border: 'rgba(205,127,50,0.45)',  glow: 'rgba(205,127,50,0.25)',  badge: '#CD7F32' },
  30: { border: 'rgba(192,192,192,0.45)', glow: 'rgba(192,192,192,0.2)',  badge: '#C0C0C0' },
  90: { border: 'rgba(212,175,55,0.55)',  glow: 'rgba(212,175,55,0.3)',   badge: '#D4AF37' },
};

export default function StakingPage({ telegramId, balance, onStaked }: StakingPageProps) {
  const [selectedDays, setSelectedDays] = useState<LockDays>(30);
  const [amount,       setAmount]       = useState('');
  const [isStaking,    setIsStaking]    = useState(false);
  const [message,      setMessage]      = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selected    = STAKE_PERIODS.find(p => p.days === selectedDays)!;
  const amountNum   = parseFloat(amount) || 0;
  const yieldAmt    = amountNum * (selected.apy / 100) * (selectedDays / 365);
  const totalReturn = amountNum + yieldAmt;
  const isValid     = amountNum > 0 && amountNum <= balance;

  const handleStake = useCallback(async () => {
    if (!isValid || isStaking) return;
    setIsStaking(true);
    setMessage(null);

    try {
      const payload: StakePayload = {
        initData:  getInitData(),
        telegramId,
        amount:    amountNum,
        lockDays:  selectedDays,
      };

      const res  = await fetch('/api/stake', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data: StakeResponse = await res.json();

      if (data.success && data.newBalance !== undefined) {
        onStaked(data.newBalance);
        setAmount('');
        setMessage({ type: 'success', text: `Staked successfully! Unlocks in ${selectedDays} days.` });
      } else {
        setMessage({ type: 'error', text: data.message ?? 'Staking failed. Try again.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please retry.' });
    } finally {
      setIsStaking(false);
    }
  }, [isValid, isStaking, telegramId, amountNum, selectedDays, onStaked]);

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-24 scroll-list">
      {/* Header */}
      <div className="mb-5">
        <h2 className="chrome-text text-xl font-black mb-0.5">Pre-Launch Staking</h2>
        <p className="text-steel-400 text-xs">
          Lock coins before TGE to earn guaranteed yields
        </p>
      </div>

      {/* Balance */}
      <div className="chrome-surface rounded-xl p-4 mb-5">
        <p className="text-steel-400 text-xs uppercase tracking-widest mb-1">Available Balance</p>
        <p className="chrome-text text-2xl font-black">{balance.toLocaleString()} BB</p>
      </div>

      {/* Period selector */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {STAKE_PERIODS.map(period => {
          const colors  = PERIOD_COLORS[period.days];
          const active  = period.days === selectedDays;
          return (
            <motion.button
              key={period.days}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedDays(period.days)}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                background: active
                  ? `linear-gradient(145deg, ${colors.glow.replace('0.3', '0.12')} 0%, rgba(17,17,19,0.98) 100%)`
                  : 'rgba(17,17,19,0.9)',
                border: `1px solid ${active ? colors.border : 'rgba(255,255,255,0.07)'}`,
                boxShadow: active ? `0 0 20px ${colors.glow}` : 'none',
              }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: colors.badge }}>
                {period.badge}
              </p>
              <p className="text-chrome-200 font-black text-base leading-none mb-0.5">
                {period.days}d
              </p>
              <p className="font-bold text-xs" style={{ color: colors.badge }}>
                {period.apy}% APY
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="text-steel-400 text-xs uppercase tracking-widest block mb-2">
          Amount to Stake
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            max={balance}
            className="flex-1 bg-obsidian-800 border border-obsidian-600 rounded-xl px-4 py-3 text-chrome-200 text-lg font-bold outline-none focus:border-chrome-500 transition-colors"
            style={{ touchAction: 'auto', userSelect: 'auto' }}
          />
          <button
            onClick={() => setAmount(String(Math.floor(balance)))}
            className="chrome-button px-4 rounded-xl text-obsidian-900 text-sm font-bold"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Yield calculator */}
      {amountNum > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="chrome-surface rounded-xl p-4 mb-5"
        >
          <p className="text-steel-400 text-xs uppercase tracking-widest mb-3">Projected Returns</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-steel-400 text-sm">Staked amount</span>
              <span className="text-chrome-200 text-sm font-bold">{amountNum.toLocaleString()} BB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-steel-400 text-sm">APY yield ({selected.apy}%)</span>
              <span className="text-sm font-bold" style={{ color: PERIOD_COLORS[selectedDays].badge }}>
                +{yieldAmt.toFixed(2)} BB
              </span>
            </div>
            <div className="h-px bg-obsidian-700 my-1" />
            <div className="flex justify-between">
              <span className="text-chrome-200 text-sm font-bold">Total return</span>
              <span className="chrome-text text-sm font-black">{totalReturn.toFixed(2)} BB</span>
            </div>
            <p className="text-steel-400 text-[10px] text-center">
              Unlocks after {selectedDays} days
            </p>
          </div>
        </motion.div>
      )}

      {/* Stake button */}
      <motion.button
        whileTap={isValid ? { scale: 0.97 } : {}}
        onClick={handleStake}
        disabled={!isValid || isStaking}
        className="w-full py-4 rounded-xl font-black text-base tracking-wide transition-all"
        style={{
          background:  isValid ? 'var(--chrome-button)' : 'rgba(42,42,45,0.8)',
          color:       isValid ? '#111' : '#5A6A79',
          border:      `1px solid ${isValid ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.05)'}`,
          boxShadow:   isValid ? '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
          cursor:      isValid ? 'pointer' : 'not-allowed',
        }}
      >
        {isStaking ? 'Staking...' : `Stake for ${selectedDays} Days`}
      </motion.button>

      {/* Feedback message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{   opacity: 0, y: -8 }}
            className={`mt-3 p-3 rounded-xl text-center text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-500/30 text-green-400'
                : 'bg-red-900/30 border border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info footer */}
      <p className="text-center text-steel-400 text-[10px] mt-4 pb-4">
        Staking is locked until the unlock date. Yields are distributed at TGE.
      </p>
    </div>
  );
}
