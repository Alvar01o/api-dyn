import { MikroORM } from '@mikro-orm/mysql';
import { BaseConnector } from './base.connector';
import { DatabaseStructure } from '../models/database-structure.model';


export class MysqlConnector extends BaseConnector {
  async connect(): Promise<void> {
    this.orm = await MikroORM.init({
      host: 'localhost',
      port: 3306,
      user: 'dev',
      password: 'devpass',
      dbName: 'apidyn',
    });
  }

  async loadSchema(): Promise<DatabaseStructure> {
    const em = this.orm.em.getConnection();

    const tables = await em.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    // Similar lógica adaptada a MySQL
    return { tables: [] };
  }

  async close(): Promise<void> {
    await this.orm.close(true);
  }
}
