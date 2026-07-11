import type { TelegramUser } from '@/models/types';

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
interface TelegramWebApp {
  ready(): void; expand(): void; close(): void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser; auth_date: number; hash: string;
    query_id?: string; start_param?: string;
  };
  version: string; platform: string; colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>; isExpanded: boolean;
  viewportHeight: number; viewportStableHeight: number;
  MainButton: { text: string; show(): void; hide(): void; enable(): void; disable(): void; onClick(cb: () => void): void; };
  HapticFeedback: {
    impactOccurred(style: 'light'|'medium'|'heavy'|'rigid'|'soft'): void;
    notificationOccurred(type: 'error'|'success'|'warning'): void;
    selectionChanged(): void;
  };
  BackButton: { isVisible: boolean; show(): void; hide(): void; onClick(cb: () => void): void; };
  disableVerticalSwipes?(): void;
  requestFullscreen?(): void;
}

export function initTelegram(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  try { tg.ready(); tg.expand(); tg.requestFullscreen?.(); tg.disableVerticalSwipes?.(); }
  catch (e) { console.warn('[BB] Telegram init:', e); }
}
export const getTelegramWebApp  = () => window.Telegram?.WebApp ?? null;
export const getTelegramUser    = () => window.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
export const getInitData        = () => window.Telegram?.WebApp?.initData ?? '';
export const getStartParam      = () => window.Telegram?.WebApp?.initDataUnsafe?.start_param;
export const haptic = {
  tap:     () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'),
  success: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'),
  error:   () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'),
  light:   () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'),
  heavy:   () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'),
};
export const isInTelegram = () => Boolean(window.Telegram?.WebApp?.initData);
