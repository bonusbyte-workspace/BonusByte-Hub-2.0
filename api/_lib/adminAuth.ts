import * as crypto from 'crypto';

/**
 * Validates Telegram WebApp initData using HMAC-SHA256.
 * Returns the parsed user object if valid, throws if invalid.
 */
export function validateInitData(initData: string): Record<string, string> {
  const secret = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const params = new URLSearchParams(initData);
  const hash   = params.get('hash');
  if (!hash) throw new Error('Missing hash in initData');

  // Build the data check string (sorted key=value pairs, excluding hash)
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // HMAC-SHA256 with key derived from bot token
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(secret)
    .digest();

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (expectedHash !== hash) {
    throw new Error('initData validation failed — possible tampering');
  }

  // Check timestamp freshness (5 min window)
  const authDate = parseInt(params.get('auth_date') ?? '0', 10);
  const age      = Math.floor(Date.now() / 1000) - authDate;
  if (age > 300) {
    throw new Error('initData expired');
  }

  // Parse user object
  const userStr = params.get('user');
  if (!userStr) throw new Error('No user in initData');

  return JSON.parse(userStr) as Record<string, string>;
}

/**
 * Validates a Firebase ID token and returns the decoded claims.
 * Use this for admin-only routes.
 */
export async function validateAdminToken(
  authHeader: string | undefined
): Promise<{ uid: string; role: string }> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const { auth } = await import('./firebase');
  const token    = authHeader.replace('Bearer ', '');
  const decoded  = await auth.verifyIdToken(token);

  const ADMIN_ROLES = ['developer', 'support', 'economy'];
  const role        = (decoded['role'] as string) ?? 'user';

  if (!ADMIN_ROLES.includes(role)) {
    throw new Error('Insufficient permissions');
  }

  return { uid: decoded.uid, role };
}
