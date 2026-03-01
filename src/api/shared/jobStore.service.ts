import fs from 'fs/promises';
import path from 'path';
import { SchemaJob } from './types';
import { randomUUID } from 'crypto';

const basePath = process.env.SCHEMA_JOB_STORE_PATH || '/tmp/schema-jobs';

async function ensureDir() {
  await fs.mkdir(basePath, { recursive: true });
}

function jobPath(id: string) {
  return path.join(basePath, `${id}.json`);
}

export async function createJob(init: Omit<SchemaJob, 'id' | 'createdAt' | 'status' | 'progress'>) {
  await ensureDir();
  const job: SchemaJob = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'queued',
    progress: 0,
    ...init,
  };
  await fs.writeFile(jobPath(job.id), JSON.stringify(job, null, 2));
  return job;
}

export async function updateJob(job: SchemaJob) {
  await fs.writeFile(jobPath(job.id), JSON.stringify(job, null, 2));
}

export async function getJob(id: string): Promise<SchemaJob | null> {
  try {
    const content = await fs.readFile(jobPath(id), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Dedupe: buscar job exitoso por engine+hash (scan de dir; ok para MVP)
 * Si esto crece, lo pasamos a Redis o una DB interna.
 */
export async function findSuccessfulJobByHash(engine: string, hash: string): Promise<SchemaJob | null> {
  await ensureDir();
  const files = await fs.readdir(basePath);
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const content = await fs.readFile(path.join(basePath, f), 'utf8');
    const job: SchemaJob = JSON.parse(content);
    if (job.engine === engine && job.hash === hash && job.status === 'success') return job;
  }
  return null;
}