import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import { MikroORM as MysqlORM } from '@mikro-orm/mysql';

async function run() {
  const type = process.env.DB_TYPE;

  if (type === 'postgres') {
    const orm = await MikroORM.init({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME,
    });

    console.log('Connected to PostgreSQL');
    await orm.close(true);
  }

  if (type === 'mysql') {
    const orm = await MysqlORM.init({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME,
    });

    console.log('Connected to MySQL');
    await orm.close(true);
  }
}

run();
