export type Engine = 'mysql' | 'postgres';
export type JobStatus = 'queued' | 'running' | 'success' | 'failed';

export interface SchemaJob {
  id: string;
  engine: Engine;
  dbName: string;

  hash: string;
  schemaPath: string;

  status: JobStatus;
  progress: number; // 0..100
  stage?: string;

  error?: string;
  createdAt: string;
  finishedAt?: string;

  result?: {
    createdDb?: boolean;
    applied?: boolean;
  };
}