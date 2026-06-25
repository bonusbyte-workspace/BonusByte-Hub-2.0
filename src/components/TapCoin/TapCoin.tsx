import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TapCoinProps {
  onTap:       (x: number, y: number) => void;
  energyRatio: number; // 0–1
  tapCount:    number;
}

interface Ripple {
  id:  number;
  x:   number;
  y:   number;
}

export default function TapCoin({ onTap, energyRatio, tapCount }: TapCoinProps) {
  const coinRef    = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples,   setRipples]   = useState<Ripple[]>([]);
  const rippleId   = useRef(0);
  const lastTap    = useRef(0);

  const spawnRipple = useCallback((x: number, y: number) => {
    const id = rippleId.current++;
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 500);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (energyRatio <= 0) return;

    const now = Date.now();
    if (now - lastTap.current < 50) return; // debounce rapid multi-touch
    lastTap.current = now;

    const rect = coinRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsPressed(true);
    spawnRipple(x, y);
    onTap(e.clientX, e.clientY);

    setTimeout(() => setIsPressed(false), 120);
  }, [energyRatio, onTap, spawnRipple]);

  const isEmpty   = energyRatio <= 0;
  const dimAmount = 0.4 + energyRatio * 0.6;

  return (
    <div className="flex items-center justify-center w-full" style={{ height: '280px' }}>
      {/* Outer glow ring */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ambient ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width:  240,
            height: 240,
            background: 'radial-gradient(circle, rgba(192,192,192,0.06) 0%, transparent 70%)',
            border: '1px solid rgba(192,192,192,0.08)',
          }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Second ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width:  200,
            height: 200,
            border: '1px solid rgba(192,192,192,0.12)',
          }}
          animate={{ scale: [1, 1.02, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Tap ripple effects */}
        {ripples.map(r => (
          <div
            key={r.id}
            className="tap-ripple absolute rounded-full pointer-events-none"
            style={{
              left:      r.x - 30,
              top:       r.y - 30,
              width:     60,
              height:    60,
              border:    '2px solid rgba(79,195,247,0.6)',
              transform: 'scale(0)',
            }}
          />
        ))}

        {/* Main Coin */}
        <motion.div
          ref={coinRef}
          className="relative coin-3d select-none"
          style={{
            width:  180,
            height: 180,
            cursor: isEmpty ? 'not-allowed' : 'pointer',
            touchAction:  'none',
            userSelect:   'none',
            WebkitUserSelect: 'none',
            filter: isEmpty
              ? 'grayscale(0.6) brightness(0.5)'
              : `brightness(${dimAmount})`,
          }}
          animate={{
            scale:   isPressed ? 0.92 : 1,
            rotateX: isPressed ? 8    : 0,
          }}
          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
          onPointerDown={handlePointerDown}
          whileHover={!isEmpty ? { scale: 1.03 } : {}}
        >
          {/* Coin body */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #2A2A2D 0%, #1A1A1D 40%, #0F0F11 100%)',
              border:     '2px solid rgba(192,192,192,0.25)',
              boxShadow:  isPressed
                ? '0 2px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(192,192,192,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Inner chrome ring */}
            <div
              className="absolute inset-3 rounded-full pointer-events-none"
              style={{
                border:     '1px solid rgba(192,192,192,0.15)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
              }}
            />

            {/* Logo */}
            <img
              src="/logo.png"
              alt="BonusByte"
              className="w-24 h-24 object-contain pointer-events-none select-none"
              draggable={false}
              style={{
                filter:    'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                transform: `scale(${isPressed ? 0.95 : 1})`,
                transition:'transform 0.1s ease',
              }}
            />

            {/* Energy overlay when empty */}
            {isEmpty && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60">
                <span className="text-steel-400 text-xs font-bold tracking-widest uppercase">
                  Recharging
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Tap counter (bottom) */}
      <div className="absolute bottom-0 flex flex-col items-center gap-1 pointer-events-none"
        style={{ transform: 'translateY(220px)' }}>
        <span className="text-steel-400 text-xs tracking-widest uppercase">
          {tapCount.toLocaleString()} taps
        </span>
      </div>
    </div>
  );
}
