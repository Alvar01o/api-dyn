import { MikroORM } from '@mikro-orm/postgresql';
import { BaseConnector } from './base.connector';
import { DatabaseStructure } from '../models/database-structure.model';

export class PostgresConnector extends BaseConnector {

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
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);

    // 2️⃣ Columnas
    const columns = await connection.execute(`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);

    // 3️⃣ Foreign Keys
    const foreignKeys = await connection.execute(`
    SELECT
        tc.table_name,
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
      AND tc.table_schema = 'public'
  `);

    // 4️⃣ Índices PostgreSQL (excluye PK)
    const indexes = await connection.execute(`
SELECT
  t.relname AS table_name,
  i.relname AS index_name,
  ix.indisunique AS is_unique,
  a.attname AS column_name,
  s.n AS column_order
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN generate_subscripts(ix.indkey, 1) AS s(n) ON TRUE
JOIN pg_attribute a
  ON a.attrelid = t.oid
 AND a.attnum = ix.indkey[s.n]
WHERE t.relkind = 'r'
  AND NOT ix.indisprimary
  AND t.relnamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = 'public'
  )
ORDER BY table_name, index_name, column_order;
  `);

    const structure: DatabaseStructure = { tables: [] };
    const tableMap = new Map<string, any>();

    // Inicializar tablas
    for (const t of tables as any[]) {
      tableMap.set(t.table_name, {
        name: t.table_name,
        columns: [],
        foreignKeys: [],
        indexes: [],
      });
    }

    // Agrupar columnas
    for (const col of columns as any[]) {
      const table = tableMap.get(col.table_name);
      if (!table) continue;

      table.columns.push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default,
        isPrimary: false,
      });
    }

    // Agrupar foreign keys
    for (const fk of foreignKeys as any[]) {
      const table = tableMap.get(fk.table_name);
      if (!table) continue;

      table.foreignKeys.push({
        columnName: fk.column_name,
        referencedTable: fk.referenced_table,
        referencedColumn: fk.referenced_column,
        constraintName: fk.constraint_name,
      });
    }

    // Agrupar índices
    const indexMap = new Map<string, any>();

    for (const idx of indexes as any[]) {
      const key = `${idx.table_name}:${idx.index_name}`;

      if (!indexMap.has(key)) {
        indexMap.set(key, {
          tableName: idx.table_name,
          name: idx.index_name,
          unique: idx.is_unique,
          columns: [],
        });
      }

      indexMap.get(key).columns.push(idx.column_name);
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

    console.log(structure);
    return structure;
  }
  async close(): Promise<void> {
    if (this.orm) {
      await this.orm.close(true);
    }
  }
}
