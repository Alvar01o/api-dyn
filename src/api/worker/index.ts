import IORedis from 'ioredis';
import { startSchemaWorker } from './schema.worker';

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});

startSchemaWorker(connection);
console.log('Schema worker started');