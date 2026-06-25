// ============================================================
// BonusByte Hub 2.0 — Strict TypeScript Type Definitions
// ============================================================

// ── User & Auth ──────────────────────────────────────────────
export type UserRole = 'user' | 'support' | 'developer' | 'economy';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface UserProfile {
  telegramId: string;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  balance: number;
  totalEarned: number;
  energyAtLastSync: number;
  lastSyncAt: number;       // Unix timestamp ms
  walletAddress?: string;
  role: UserRole;
  createdAt: number;
  referrerId?: string;
  dailyEarned: number;
  dailyResetAt: number;     // Unix timestamp ms
  tapLevel: number;         // multiplier tier
  energyLevel: number;      // max energy tier
}

// ── Staking ──────────────────────────────────────────────────
export type LockDays = 7 | 30 | 90;

export interface StakeRecord {
  id: string;
  userId: string;
  amount: number;
  lockDays: LockDays;
  apy: number;
  stakedAt: number;
  unlockAt: number;
  status: 'active' | 'unlocked' | 'claimed';
  projectedYield: number;
}

export interface StakePeriod {
  days: LockDays;
  apy: number;
  label: string;
  badge: string;
}

export const STAKE_PERIODS: StakePeriod[] = [
  { days: 7,  apy: 12,  label: '7 Days',  badge: 'Starter'  },
  { days: 30, apy: 36,  label: '30 Days', badge: 'Advanced' },
  { days: 90, apy: 120, label: '90 Days', badge: 'Elite'    },
];

// ── Leaderboard ──────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  telegramId: string;
  username: string;
  firstName: string;
  photoUrl?: string;
  totalEarned: number;
  dailyEarned: number;
  walletAddress?: string;
}

export interface CachedLeaderboard {
  players: LeaderboardEntry[];
  updatedAt: number;
}

export type LeaderboardFilter = 'all-time' | 'daily';

// ── Game Config ───────────────────────────────────────────────
export interface GameConfig {
  maxCPS: number;
  maxEnergy: number;
  regenRate: number;       // energy per second
  coinsPerTap: number;
  energyPerTap: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  maxCPS:       parseInt(import.meta.env.VITE_MAX_CPS    || '20'),
  maxEnergy:    parseInt(import.meta.env.VITE_MAX_ENERGY  || '1000'),
  regenRate:    parseInt(import.meta.env.VITE_REGEN_RATE  || '3'),
  coinsPerTap:  parseInt(import.meta.env.VITE_COINS_PER_TAP   || '1'),
  energyPerTap: parseInt(import.meta.env.VITE_ENERGY_PER_TAP  || '1'),
};

// ── API Payloads & Responses ──────────────────────────────────
export interface SyncPayload {
  telegramId: string;
  initData: string;
  clicks: number;
  deltaMs: number;
  clientEnergy: number;
  timestamp: number;
}

export interface SyncResponse {
  success: boolean;
  balance: number;
  energy: number;
  message?: string;
}

export interface StakePayload {
  initData: string;
  telegramId: string;
  amount: number;
  lockDays: LockDays;
}

export interface StakeResponse {
  success: boolean;
  stakeId?: string;
  message?: string;
  newBalance?: number;
}

// ── Physics / Particles ───────────────────────────────────────
export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  opacity: number;
  rotation: number;
  scale: number;
  createdAt: number;
  type: 'coin' | 'text';
}

export interface PhysicsConfig {
  gravity: number;
  bounciness: number;
  friction: number;
  particleLifeMs: number;
}

// ── TON Wallet ────────────────────────────────────────────────
export interface WalletState {
  isConnected: boolean;
  address?: string;
  shortAddress?: string;
  network?: 'mainnet' | 'testnet';
}

// ── Loading / Splash ──────────────────────────────────────────
export type LoadingPhase =
  | 'telegram-init'
  | 'auth-resolve'
  | 'config-fetch'
  | 'asset-preload'
  | 'complete';

export interface LoadingState {
  phase: LoadingPhase;
  progress: number;      // 0-100
  label: string;
}

// ── Admin ─────────────────────────────────────────────────────
export interface AdminUser {
  uid: string;
  email: string;
  role: UserRole;
}

export type AdminModule = 'developer' | 'support' | 'economy' | 'marketing';

export interface AntiCheatLog {
  id: string;
  telegramId: string;
  reason: string;
  clicksReported: number;
  maxAllowed: number;
  timestamp: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: number;
  updatedAt: number;
  adminNote?: string;
}

export interface EconomyStats {
  totalCirculatingSupply: number;
  totalStaked: number;
  totalUsers: number;
  stakingPools: {
    days7:  { totalStaked: number; activeStakers: number; apy: number };
    days30: { totalStaked: number; activeStakers: number; apy: number };
    days90: { totalStaked: number; activeStakers: number; apy: number };
  };
}

export interface MarketingStats {
  dau: number;
  mau: number;
  walletConversionRate: number;
  totalStakedVolume: number;
  referralCount: number;
  newUsersToday: number;
}

export interface DevMetrics {
  apiLatencyMs: number;
  firestoreReadsToday: number;
  firestoreWritesToday: number;
  antiCheatBlocksToday: number;
  activeUsers: number;
  syncCallsPerMinute: number;
}
