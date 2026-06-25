import { useLeaderboard } from '@/hooks/useLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import type { LeaderboardEntry } from '@/models/types';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg rank-1">🥇</span>;
  if (rank === 2) return <span className="text-lg rank-2">🥈</span>;
  if (rank === 3) return <span className="text-lg rank-3">🥉</span>;
  return (
    <span className="text-steel-400 text-sm font-bold w-6 text-center">
      {rank}
    </span>
  );
}

function PlayerRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isTop3 = entry.rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1,  x: 0   }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 chrome-surface ${
        isTop3 ? 'border-chrome' : ''
      }`}
      style={isTop3 ? {
        background: `linear-gradient(135deg, rgba(${
          entry.rank === 1 ? '212,175,55' :
          entry.rank === 2 ? '192,192,192' :
                             '205,127,50'
        },0.08) 0%, rgba(17,17,19,0.95) 100%)`,
      } : {}}
    >
      <RankBadge rank={entry.rank} />

      {/* Avatar placeholder */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{
          background:  'linear-gradient(135deg, #1A1A1D, #2A2A2D)',
          border:      '1px solid rgba(192,192,192,0.15)',
          color:       '#9A9A9A',
        }}
      >
        {(entry.firstName?.[0] ?? entry.username?.[0] ?? '?').toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-chrome-200 text-sm font-semibold truncate leading-none mb-0.5">
          {entry.firstName || entry.username || 'Player'}
        </p>
        {entry.username && (
          <p className="text-steel-400 text-xs truncate">@{entry.username}</p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="chrome-text text-sm font-bold">
          {entry.totalEarned.toLocaleString()}
        </p>
        <p className="text-steel-400 text-[10px]">BB coins</p>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { entries, isLoading, error, filter, setFilter, updatedAt } = useLeaderboard();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h2 className="chrome-text text-xl font-black mb-1">Leaderboard</h2>
        {updatedAt && (
          <p className="text-steel-400 text-[10px]">
            Updated {new Date(updatedAt).toLocaleTimeString()}
          </p>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3">
          {(['all-time', 'daily'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f
                  ? 'chrome-button text-obsidian-900'
                  : 'bg-obsidian-800 text-steel-400 border border-obsidian-700'
              }`}
            >
              {f === 'all-time' ? 'All Time' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 scroll-list px-4 pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-2 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-obsidian-800 animate-pulse"
                style={{ opacity: 1 - i * 0.1 }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-steel-400 text-sm">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-steel-400 text-sm">No players yet — be the first!</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry, i) => (
              <PlayerRow key={entry.telegramId} entry={entry} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
