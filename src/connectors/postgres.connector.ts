import { MikroORM } from '@mikro-orm/postgresql';
import { BaseConnector } from './base.connector';
import { DatabaseStructure } from '../models/database-structure.model';

export class PostgresConnector extends BaseConnector {

  async connect(): Promise<void> {
    this.orm = await MikroORM.init({
      host: 'localhost',
      port: 5432,
      user: 'dev',
      password: 'devpass',
      dbName: 'apidyn',
      entities: ['dist/**/*.entity.js'], // 👈 hack requerido

    });
  }

  async loadSchema(): Promise<DatabaseStructure> {
    const em = this.orm.em.getConnection();

    const tables = await em.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const structure: DatabaseStructure = { tables: [] };

    for (const t of tables) {
      const tableName = t.table_name;

      const columns = await em.execute(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
      `);

      const fks = await em.execute(`
        SELECT
          kcu.column_name,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column,
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name='${tableName}'
      `);

      structure.tables.push({
        name: tableName,
        columns: columns.map((c: any) => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default,
          isPrimary: false, // podemos mejorarlo luego
        })),
        foreignKeys: fks.map((fk: any) => ({
          columnName: fk.column_name,
          referencedTable: fk.referenced_table,
          referencedColumn: fk.referenced_column,
          constraintName: fk.constraint_name,
        })),
        indexes: [] // luego agregamos introspección de índices
      });
    }

    return structure;
  }

  async close(): Promise<void> {
    await this.orm.close(true);
  }
}
