import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LoadingState } from '@/models/types';

interface SplashScreenProps {
  onComplete: () => void;
}

const PHASES: LoadingState[] = [
  { phase: 'telegram-init',  progress: 20,  label: 'Initializing Telegram...'   },
  { phase: 'auth-resolve',   progress: 45,  label: 'Authenticating session...'  },
  { phase: 'config-fetch',   progress: 65,  label: 'Loading game config...'     },
  { phase: 'asset-preload',  progress: 85,  label: 'Preloading assets...'       },
  { phase: 'complete',       progress: 100, label: 'Welcome to BonusByte!'      },
];

const PHASE_DURATION = 600; // ms per phase

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [visible,    setVisible]    = useState(true);

  const current = PHASES[phaseIndex] ?? PHASES[PHASES.length - 1];

  useEffect(() => {
    if (phaseIndex >= PHASES.length - 1) {
      // Hold on "Welcome" briefly then fade out
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 600);
      }, 500);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setPhaseIndex(i => i + 1);
    }, PHASE_DURATION);

    return () => clearTimeout(t);
  }, [phaseIndex, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center splash-bg"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Ambient background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(192,192,192,0.6) 0%, transparent 70%)' }}
            />
          </div>

          {/* Logo */}
          <motion.div
            className="relative mb-12"
            initial={{ scale: 0.4, opacity: 0, rotateY: -20 }}
            animate={{ scale: 1,   opacity: 1, rotateY: 0   }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <img
              src="/logo.png"
              alt="BonusByte"
              className="splash-logo w-36 h-36 object-contain select-none"
              draggable={false}
            />
          </motion.div>

          {/* App Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1
              className="chrome-text text-4xl font-black tracking-tight mb-1"
              style={{ letterSpacing: '-0.03em' }}
            >
              BonusByte
            </h1>
            <p className="text-steel-400 text-sm font-medium tracking-widest uppercase">
              Tap · Earn · Stake
            </p>
          </motion.div>

          {/* Progress Section */}
          <motion.div
            className="w-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Progress bar track */}
            <div className="h-1 rounded-full bg-obsidian-700 overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-full progress-bar-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${current.progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Phase label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={current.phase}
                className="text-center text-steel-400 text-xs"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{   opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {current.label}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Version tag */}
          <motion.p
            className="absolute bottom-8 text-obsidian-600 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1 }}
          >
            v2.0.0
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
