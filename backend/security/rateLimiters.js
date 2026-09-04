import rateLimit from "express-rate-limit";

export function createRateLimiter({
  windowMs = 1000,
  limit = 10,
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export const standardReadLimiter =
  createRateLimiter();

export const standardWriteLimiter =
  createRateLimiter({
    limit: 5,
  });