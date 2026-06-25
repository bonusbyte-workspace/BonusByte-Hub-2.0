import type { TelegramUser } from '@/models/types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date: number;
    hash: string;
    query_id?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    onClick(callback: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
  };
  disableVerticalSwipes?(): void;
  requestFullscreen?(): void;
}

// Initialize and expand Telegram WebApp
export function initTelegram(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    // Attempt full-screen on newer SDK versions
    tg.requestFullscreen?.();
    tg.disableVerticalSwipes?.();
  } catch (err) {
    console.warn('[BonusByte] Telegram init error:', err);
  }
}

// Get the raw Telegram WebApp instance
export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

// Get the parsed Telegram user from initDataUnsafe
export function getTelegramUser(): TelegramUser | null {
  const tg = window.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user ?? null;
}

// Get the raw initData string for server-side HMAC validation
export function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? '';
}

// Haptic feedback helpers
export const haptic = {
  tap: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'),
  success: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'),
  error: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'),
  light: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'),
  heavy: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'),
};

// Format a Telegram user display name
export function getDisplayName(user: TelegramUser | null): string {
  if (!user) return 'Player';
  if (user.username) return `@${user.username}`;
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.join(' ') || 'Player';
}

// Check if we're running inside Telegram
export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}
