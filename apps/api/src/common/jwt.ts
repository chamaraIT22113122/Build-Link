import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config';
import { JwtTokenPayload, UserRole } from '@buildlink/shared';

export function signJwt(
  payload: Omit<JwtTokenPayload, 'iat' | 'exp'>,
  options?: SignOptions
): string {
  const defaultOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, { ...defaultOptions, ...options });
}

export function verifyJwt(token: string): JwtTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;
    if (decoded && decoded.sub && decoded.email && decoded.role) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}
