import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokens, SafeUserDto, UserRole } from '@data-circular/shared';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

/**
 * Genera el par de tokens (Access Token y Refresh Token) para una sesión de usuario.
 */
export function generateTokens(user: SafeUserDto): AuthTokens {
  const accessPayload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  const refreshPayload: RefreshTokenPayload = {
    sub: user.id,
    type: 'refresh',
  };

  const accessTokenOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  };

  const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, accessTokenOptions);
  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, refreshTokenOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

/**
 * Verifica y decodifica un Access Token JWT.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Tipo de token inválido para autorización');
  }
  return decoded;
}

/**
 * Verifica y decodifica un Refresh Token JWT.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Tipo de token inválido para renovación');
  }
  return decoded;
}
