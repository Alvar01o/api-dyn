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

  // 1️⃣ Tablas
  const tables = await connection.execute(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
  `);

  // 2️⃣ Columnas
  const columns = await connection.execute(`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      column_key
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
  `);

  // 3️⃣ Foreign Keys
  const foreignKeys = await connection.execute(`
    SELECT
      table_name,
      column_name,
      referenced_table_name,
      referenced_column_name,
      constraint_name
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND referenced_table_name IS NOT NULL
  `);

  // 4️⃣ Índices
  const indexes = await connection.execute(`
    SELECT
      table_name,
      index_name,
      column_name,
      non_unique,
      seq_in_index
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    ORDER BY table_name, index_name, seq_in_index
  `);

  const structure: DatabaseStructure = { tables: [] };
  const tableMap = new Map<string, any>();

  // Inicializar tablas
  for (const t of tables as any[]) {
    const name = t.TABLE_NAME || t.table_name;
    tableMap.set(name, {
      name,
      columns: [],
      foreignKeys: [],
      indexes: [],
    });
  }

  // Columnas
  for (const col of columns as any[]) {
    const table = tableMap.get(col.TABLE_NAME || col.table_name);
    if (!table) continue;

    table.columns.push({
      name: col.COLUMN_NAME || col.column_name,
      type: col.DATA_TYPE || col.data_type,
      nullable: (col.IS_NULLABLE || col.is_nullable) === 'YES',
      default: col.COLUMN_DEFAULT || col.column_default,
      isPrimary: (col.COLUMN_KEY || col.column_key) === 'PRI',
    });
  }

  // Foreign Keys
  for (const fk of foreignKeys as any[]) {
    const table = tableMap.get(fk.TABLE_NAME || fk.table_name);
    if (!table) continue;

    table.foreignKeys.push({
      columnName: fk.COLUMN_NAME || fk.column_name,
      referencedTable: fk.REFERENCED_TABLE_NAME || fk.referenced_table_name,
      referencedColumn: fk.REFERENCED_COLUMN_NAME || fk.referenced_column_name,
      constraintName: fk.CONSTRAINT_NAME || fk.constraint_name,
    });
  }

  // Índices agrupados
  const indexMap = new Map<string, any>();

  for (const idx of indexes as any[]) {
    const tableName = idx.TABLE_NAME || idx.table_name;
    const indexName = idx.INDEX_NAME || idx.index_name;

    const key = `${tableName}:${indexName}`;

    if (!indexMap.has(key)) {
      indexMap.set(key, {
        tableName,
        name: indexName,
        unique: (idx.NON_UNIQUE ?? idx.non_unique) === 0,
        columns: [],
      });
    }

    indexMap.get(key).columns.push(
      idx.COLUMN_NAME || idx.column_name
    );
  }

  // Asignar índices a cada tabla
  for (const index of indexMap.values()) {
    const table = tableMap.get(index.tableName);
    if (!table) continue;

    table.indexes.push({
      name: index.name,
      unique: index.unique,
      columns: index.columns,
    });
  }

  structure.tables = Array.from(tableMap.values());

  return structure;
}

  async close(): Promise<void> {
    if (this.orm) {
      await this.orm.close(true);
    }
  }
}
