import { MikroORM, Options } from '@mikro-orm/core';
import { DatabaseStructure } from '../models/database-structure.model';

export abstract class BaseConnector {
  protected orm!: MikroORM;
  protected async waitForConnection(initFn: () => Promise<any>, retries = 10, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await initFn();
      } catch (err) {
        console.log(`DB not ready, retrying... (${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw new Error('Database not reachable after retries');
  }

  protected getDbConfig(): Omit<Options, 'type'> {
    const {
      DB_HOST,
      DB_PORT,
      DB_USER,
      DB_PASSWORD,
      DB_NAME,
    } = process.env;

    if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
      throw new Error(
        'Missing required database environment variables: ' +
        'DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME'
      );
    }

    return {
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      dbName: DB_NAME,
      entities: [],
      discovery: {
        warnWhenNoEntities: false,
      },
    };
  }

  abstract connect(): Promise<void>;
  abstract loadSchema(): Promise<DatabaseStructure>;

  async close(): Promise<void> {
    if (this.orm) {
      await this.orm.close(true);
    }
  }
}
