import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});

export const schemaQueue = new Queue('schema-jobs', { connection });
export const redisConnection = connection;