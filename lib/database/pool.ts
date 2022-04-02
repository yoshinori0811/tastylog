import * as mysql from "mysql2"
import * as util from "util"
const config = require("../../config/mysql.config");

export const pool = mysql.createPool({
  host: config.HOST,
  port: config.PORT,
  user: config.USERNAME,
  password: config.PASSWORD,
  database: config.DATABASE,
  connectionLimit: config.CONNECTION_LIMIT,
  queueLimit: config.QUEUE_LIMIT,
});

export const getConnection = util.promisify(pool.getConnection).bind(pool);
export const executeQuery = util.promisify(pool.query).bind(pool);
export const releaseConnection =  function (connection: mysql.PoolConnection) {
      connection.release();
  };
export const end = util.promisify(pool.end).bind(pool);
