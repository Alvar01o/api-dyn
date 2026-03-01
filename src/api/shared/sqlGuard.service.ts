export function validateSqlContent(sql: string) {
  if (process.env.SCHEMA_ENABLE_SQL_GUARD !== 'true') return;

  const forbidden = (process.env.SCHEMA_FORBIDDEN_KEYWORDS || '')
    .split(',')
    .map(k => k.trim().toUpperCase())
    .filter(Boolean);

  const upperSql = sql.toUpperCase();

  for (const word of forbidden) {
    if (upperSql.includes(word)) {
      throw new Error(`Forbidden SQL keyword detected: ${word}`);
    }
  }
}