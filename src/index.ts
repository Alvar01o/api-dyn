import 'reflect-metadata';
import 'dotenv/config';   // 👈 primero
import { PostgresConnector } from './core/connectors/postgres.connector';
import { MysqlConnector } from './core/connectors/mysql.connector';
import { BaseConnector } from './core/connectors/base.connector';

async function run() {
  const type = process.env.DB_TYPE;

  let connector: BaseConnector;

  switch (type) {
    case 'postgres':
      connector = new PostgresConnector();
      break;

    case 'mysql':
      connector = new MysqlConnector();
      break;

    default:
      throw new Error(`Unsupported DB type: ${type}`);
  }

  try {
    console.log('Before connect');
    await connector.connect();
    console.log('Connected');

    console.log('Before loadSchema');
    const schema = await connector.loadSchema();
    console.log('Schema loaded');

    console.log('Tables count:', schema.tables.length);

  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  } finally {
    await connector.close();
  }
}

run();
