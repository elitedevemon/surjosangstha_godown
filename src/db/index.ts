import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2/promise";
import { mysqlConfig } from "./config";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsMysqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsMysqlPool ??
  mysql.createPool({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    charset: mysqlConfig.charset,
    decimalNumbers: mysqlConfig.decimalNumbers,
    connectTimeout: mysqlConfig.connectTimeout,
    idleTimeout: mysqlConfig.idleTimeout,
    enableKeepAlive: mysqlConfig.enableKeepAlive,
    ...(mysqlConfig.ssl ? { ssl: { rejectUnauthorized: true } } : {}),
    waitForConnections: true,
    connectionLimit: mysqlConfig.connectionLimit,
  });

globalForDb.__arenaNextJsMysqlPool = pool;

export const db = drizzle(pool);
