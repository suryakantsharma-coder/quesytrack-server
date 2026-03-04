import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment configuration.
 * OPENAI_API_KEY is required for AI chat; never expose it to the frontend.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  PORT: process.env.PORT || 4000,
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  // In development: disabled by default; set RATE_LIMIT_MAX to enable. In production: 1000/min default.
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX !== undefined
    ? Number(process.env.RATE_LIMIT_MAX)
    : isDev
      ? 0
      : 1000,
};
