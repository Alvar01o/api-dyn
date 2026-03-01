import rateLimit from 'express-rate-limit';

export const schemaRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
});