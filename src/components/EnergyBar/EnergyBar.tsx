import { motion } from 'framer-motion';

interface EnergyBarProps {
  energy:    number;
  maxEnergy: number;
}

export default function EnergyBar({ energy, maxEnergy }: EnergyBarProps) {
  const ratio      = Math.max(0, Math.min(1, energy / maxEnergy));
  const percentage = Math.round(ratio * 100);

  const color =
    ratio > 0.6 ? '#4FC3F7' :
    ratio > 0.3 ? '#FFA726' :
                  '#EF5350';

  const glow =
    ratio > 0.6 ? 'rgba(79,195,247,0.5)' :
    ratio > 0.3 ? 'rgba(255,167,38,0.5)' :
                  'rgba(239,83,80,0.5)';

  return (
    <div className="flex items-center gap-3 px-5 py-2">
      {/* Lightning icon */}
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="flex-shrink-0">
        <path
          d="M8 1L1 10h6l-1 7 7-9H7l1-7z"
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      </svg>

      {/* Bar track */}
      <div className="flex-1 h-2 rounded-full bg-obsidian-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}99 0%, ${color} 100%)`,
            boxShadow:  `0 0 8px ${glow}`,
          }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </div>

      {/* Label */}
      <span
        className="text-xs font-bold tabular-nums flex-shrink-0 w-20 text-right"
        style={{ color }}
      >
        {Math.floor(energy).toLocaleString()} / {maxEnergy.toLocaleString()}
      </span>
    </div>
  );
}
