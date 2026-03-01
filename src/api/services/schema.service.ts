import fs from 'fs/promises';
import { validateSqlContent } from './sqlGuard.service';
import { createJob, updateJob } from './jobStore.service';

import { badRequest } from '../errors/ApiError';
import { MysqlConnector } from '../../core/connectors/mysql.connector';
import { PostgresConnector } from '../../core/connectors/postgres.connector';

export type Engine = 'mysql' | 'postgres';

const VALID_DB_NAME = /^[a-zA-Z0-9_]{1,100}$/;

function mustBool(name: string, def = false) {
  const v = process.env[name];
  if (v === undefined) return def;
  return v === 'true';
}



export async function createAndApplySchema(params: {
  engine: 'mysql' | 'postgres';
  dbName: string;
  schemaPath: string;
}) {
  const { engine, dbName, schemaPath } = params;

  const job = await createJob(engine, dbName);

  try {
    const sql = await fs.readFile(schemaPath, 'utf8');

    validateSqlContent(sql);

    if (process.env.SCHEMA_DRY_RUN === 'true') {
      job.status = 'success';
      job.finishedAt = new Date().toISOString();
      await updateJob(job);
      return { dryRun: true, jobId: job.id };
    }

    // ⬇ llamamos al flujo normal
    const result = await internalCreateAndApply({engine, dbName, schemaPath});

    job.status = 'success';
    job.finishedAt = new Date().toISOString();
    await updateJob(job);

    return { ...result, jobId: job.id };

  } catch (error: any) {
    job.status = 'failed';
    job.error = error.message;
    job.finishedAt = new Date().toISOString();
    await updateJob(job);
    throw error;
  }
}


export async function internalCreateAndApply(params: {
  engine: Engine;
  dbName: string;
  schemaPath: string;
}) {
  const { engine, dbName, schemaPath } = params;

  if (!VALID_DB_NAME.test(dbName)) {
    throw badRequest('Invalid database name', 'INVALID_DB_NAME', { dbName });
  }

  const connector =
    engine === 'mysql' ? new MysqlConnector() : new PostgresConnector();

  const deleteAfter = mustBool('DELETE_SCHEMA_AFTER_APPLY', true);
  const dropOnFail = mustBool('SCHEMA_DROP_DB_ON_FAILURE', true);

  // Hardening: chequeo DB existe y comportamiento configurable
  const failIfExists = mustBool('SCHEMA_FAIL_IF_DB_EXISTS', true);
  const exists = await connector.databaseExists(dbName);

  if (exists && failIfExists) {
    throw badRequest('Database already exists', 'DB_EXISTS', { dbName });
  }

  let created = false;

  try {
    if (!exists) {
      await connector.createDatabase(dbName);
      created = true;
    }

    await connector.applySchema(dbName, schemaPath);

    if (deleteAfter) {
      await fs.unlink(schemaPath);
    }

    return { created, applied: true };
  } catch (err) {
    // si creamos DB en esta request y algo falla aplicando schema → cleanup opcional
    if (created && dropOnFail) {
      try {
        await connector.dropDatabase(dbName);
      } catch {
        // no ocultamos el error original, solo best-effort cleanup
      }
    }
    throw err;
  }
}