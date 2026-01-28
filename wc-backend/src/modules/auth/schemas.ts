import { z } from 'zod';

// Register
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
  language: z.string().max(5).optional().default('en'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Guest
export const guestSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

export type GuestInput = z.infer<typeof guestSchema>;

// Refresh
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshInput = z.infer<typeof refreshSchema>;
