import 'reflect-metadata';
import { PostgresConnector } from './connectors/postgres.connector';
import { MysqlConnector } from './connectors/mysql.connector';
import { BaseConnector } from './connectors/base.connector';

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
    await connector.connect();

    const schema = await connector.loadSchema();

    console.log(JSON.stringify(schema, null, 2));

  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  } finally {
    await connector.close();
  }
}

run();
