export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  default?: string | null;
  isPrimary: boolean;
}

export interface ForeignKeyMetadata {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  constraintName: string;
}

export interface IndexMetadata {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableMetadata {
  name: string;
  columns: ColumnMetadata[];
  foreignKeys: ForeignKeyMetadata[];
  indexes: IndexMetadata[];
}

export interface DatabaseStructure {
  tables: TableMetadata[];
}
