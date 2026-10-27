import rateLimit from 'express-rate-limit';
import { sendError } from '../common/response';

const isTest = process.env.NODE_ENV === 'test';

/**
 * General API Rate Limiter
 * 500 requests per 15 minutes in production (bypassed/generous in test environment)
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests from this IP. Please try again after 15 minutes.', 429);
  },
  skip: () => isTest,
});

/**
 * Strict Authentication & Security Rate Limiter
 * Protects against brute-force attacks on login, register, and password changes.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'AUTH_RATE_LIMIT_EXCEEDED', 'Too many authentication attempts. Please try again after 15 minutes.', 429);
  },
  skip: () => isTest,
});
