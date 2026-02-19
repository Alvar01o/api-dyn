import { MikroORM } from '@mikro-orm/mysql';
import { BaseConnector } from './base.connector';
import { DatabaseStructure } from '../models/database-structure.model';

export class MysqlConnector extends BaseConnector {

  async connect(): Promise<void> {
    this.orm = await this.waitForConnection(() =>
      MikroORM.init(this.getDbConfig())
    );
  }


  async loadSchema(): Promise<DatabaseStructure> {
    const connection = this.orm.em.getConnection();

    const tables = await connection.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    const structure: DatabaseStructure = { tables: [] };

    for (const t of tables) {
      const tableName = t.table_name;

      const columns = await connection.execute(`
        SELECT column_name, data_type, is_nullable, column_default, column_key
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = '${tableName}'
      `);

      const fks = await connection.execute(`
        SELECT
          kcu.column_name,
          kcu.referenced_table_name AS referenced_table,
          kcu.referenced_column_name AS referenced_column,
          kcu.constraint_name
        FROM information_schema.key_column_usage kcu
        WHERE kcu.table_schema = DATABASE()
          AND kcu.table_name = '${tableName}'
          AND kcu.referenced_table_name IS NOT NULL
      `);

      structure.tables.push({
        name: tableName,
        columns: columns.map((c: any) => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default,
          isPrimary: c.column_key === 'PRI',
        })),
        foreignKeys: fks.map((fk: any) => ({
          columnName: fk.column_name,
          referencedTable: fk.referenced_table,
          referencedColumn: fk.referenced_column,
          constraintName: fk.constraint_name,
        })),
        indexes: [], // se puede agregar introspección de índices después
      });
    }

    return structure;
  }

  async close(): Promise<void> {
    if (this.orm) {
      await this.orm.close(true);
    }
  }
}
