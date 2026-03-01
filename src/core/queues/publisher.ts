import IORedis from 'ioredis';

export function progressChannel(jobId: string) {
  const prefix = process.env.SCHEMA_PROGRESS_CHANNEL_PREFIX ?? 'schema:progress:';
  return `${prefix}${jobId}`;
}

export const pub = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});