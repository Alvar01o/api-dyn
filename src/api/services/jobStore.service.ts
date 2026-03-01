import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const basePath = process.env.SCHEMA_JOB_STORE_PATH || '/tmp/schema-jobs';

async function ensureDir() {
  await fs.mkdir(basePath, { recursive: true });
}

export type JobStatus = 'pending' | 'success' | 'failed';

export interface SchemaJob {
  id: string;
  engine: string;
  dbName: string;
  status: JobStatus;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

export async function createJob(engine: string, dbName: string): Promise<SchemaJob> {
  await ensureDir();

  const job: SchemaJob = {
    id: randomUUID(),
    engine,
    dbName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(path.join(basePath, job.id + '.json'), JSON.stringify(job, null, 2));
  return job;
}

export async function updateJob(job: SchemaJob) {
  await fs.writeFile(path.join(basePath, job.id + '.json'), JSON.stringify(job, null, 2));
}

export async function getJob(id: string): Promise<SchemaJob | null> {
  try {
    const content = await fs.readFile(path.join(basePath, id + '.json'), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}