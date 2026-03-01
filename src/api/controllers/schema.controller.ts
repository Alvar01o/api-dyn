import { badRequest } from '../errors/ApiError';
import { createAndApplySchema, Engine } from '../services/schema.service';

export async function uploadSchemaHandler(req: any, res: any) {
  const { engine, name } = req.body;

  if (!engine || !['mysql', 'postgres'].includes(engine)) {
    throw badRequest('Invalid engine type', 'INVALID_ENGINE', { engine });
  }
  if (!name) {
    throw badRequest('Database name is required', 'DB_NAME_REQUIRED');
  }
  if (!req.file?.path) {
    throw badRequest('Schema file is required', 'SCHEMA_REQUIRED');
  }

  const result = await createAndApplySchema({
    engine: engine as Engine,
    dbName: String(name),
    schemaPath: req.file.path,
  });

  res.json({ success: true, ...result });
}