import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { env } from '../../config/env.js';
import { Errors } from '../../shared/errors.js';
import { parseTimeToMs } from '../../shared/utils.js';
import { authRepository } from './repository.js';
import { auditService } from '../audit/service.js';
import { AUDIT_ACTIONS } from '../../shared/constants.js';
import type { RegisterInput, LoginInput, GuestInput } from './schemas.js';
import type {
  UserWithProfile,
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../shared/types.js';

const SALT_ROUNDS = 12;
const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: {
    id: string;
    email: string | null;
    isGuest: boolean;
    emailVerified: boolean;
    profile: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  tokens: AuthTokens;
}

class AuthService {
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(user: UserWithProfile): Promise<AuthTokens> {
    const accessExpiresIn = parseTimeToMs(env.JWT_ACCESS_EXPIRY);
    const refreshExpiresIn = parseTimeToMs(env.JWT_REFRESH_EXPIRY);

    // Create access token
    const accessTokenPayload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
      isGuest: user.isGuest,
    };

    const accessToken = await new jose.SignJWT(accessTokenPayload as unknown as jose.JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(env.JWT_ACCESS_EXPIRY)
      .sign(secret);

    // Create refresh token
    const refreshTokenId = uuidv4();
    const refreshTokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      jti: refreshTokenId,
    };

    const refreshToken = await new jose.SignJWT(refreshTokenPayload as unknown as jose.JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(env.JWT_REFRESH_EXPIRY)
      .sign(secret);

    // Store hashed refresh token
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshExpiresIn),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(accessExpiresIn / 1000),
    };
  }

  private formatAuthResult(user: UserWithProfile, tokens: AuthTokens): AuthResult {
    return {
      user: {
        id: user.id,
        email: user.email,
        isGuest: user.isGuest,
        emailVerified: user.emailVerified,
        profile: user.profile
          ? {
              displayName: user.profile.displayName,
              avatarUrl: user.profile.avatarUrl,
            }
          : null,
      },
      tokens,
    };
  }

  async register(
    input: RegisterInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw Errors.alreadyExists('User with this email');
    }

    // Hash password and create user
    const passwordHash = await this.hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      language: input.language,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_REGISTER,
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      newValues: { email: user.email },
      ipAddress,
      userAgent,
    });

    return this.formatAuthResult(user, tokens);
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    // Find user
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw Errors.invalidCredentials();
    }

    // Verify password
    const isValid = await this.verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw Errors.invalidCredentials();
    }

    // Check user status
    if (user.status !== 'active') {
      throw Errors.unauthorized('Your account has been suspended');
    }

    // Get full user with profile
    const fullUser = await authRepository.findUserById(user.id);
    if (!fullUser) {
      throw Errors.internal('User not found after login');
    }

    // Update last login
    await authRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(fullUser);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_LOGIN,
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return this.formatAuthResult(fullUser, tokens);
  }

  async guest(input: GuestInput, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    // Create guest user with device ID as display name prefix
    const displayName = `Guest_${input.deviceId.substring(0, 8)}`;

    const user = await authRepository.createUser({
      isGuest: true,
      role: 'guest',
      displayName,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_REGISTER,
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      newValues: { isGuest: true, deviceId: input.deviceId },
      ipAddress,
      userAgent,
    });

    return this.formatAuthResult(user, tokens);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    // Verify the refresh token
    let payload: RefreshTokenPayload;
    try {
      const result = await jose.jwtVerify(refreshToken, secret, {
        algorithms: ['HS256'],
      });
      payload = result.payload as unknown as RefreshTokenPayload;
    } catch {
      throw Errors.tokenInvalid();
    }

    // Find the stored token
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      // Token not found or already revoked - potential reuse attack
      // Revoke all tokens for this user as a security measure
      await authRepository.revokeAllUserTokens(payload.sub);
      throw Errors.tokenInvalid();
    }

    // Revoke the used token (rotation)
    await authRepository.revokeRefreshToken(storedToken.id);

    // Get user
    const user = await authRepository.findUserById(payload.sub);
    if (!user || user.status !== 'active') {
      throw Errors.unauthorized('Account is not active');
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Revoke all refresh tokens for user
    await authRepository.revokeAllUserTokens(userId);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      actorId: userId,
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  async getMe(userId: string): Promise<UserWithProfile | null> {
    return authRepository.findUserById(userId);
  }
}

export const authService = new AuthService();
