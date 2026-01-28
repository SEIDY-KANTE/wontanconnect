import { Request } from 'express';

/**
 * Parse time string to milliseconds
 * Supports: 15m, 1h, 7d, 30s
 */
export function parseTimeToMs(time: string): number {
  const match = time.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit!] || 1000);
}

/**
 * Parse time string to seconds (for JWT expiry)
 */
export function parseTimeToSeconds(time: string): number {
  return Math.floor(parseTimeToMs(time) / 1000);
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  return req.socket.remoteAddress;
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'];
}

/**
 * Omit keys from object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick keys from object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Generate random string
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
