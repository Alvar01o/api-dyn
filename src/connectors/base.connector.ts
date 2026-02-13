import { MikroORM } from '@mikro-orm/core';
import { DatabaseStructure } from '../models/database-structure.model';

export abstract class BaseConnector {
  protected orm!: MikroORM;

  abstract connect(): Promise<void>;
  abstract loadSchema(): Promise<DatabaseStructure>;
  abstract close(): Promise<void>;
}
