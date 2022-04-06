const path = require("path");
const { sql } = require("@garafu/mysql-fileloader")({ root: path.join(__dirname, "./sql") });
import * as pool from "./pool"


const Transaction = require("./transaction");

const MYSQLClient = {
  executeQuery: async function (query: string, values:any) {

    let results = await pool.executeQuery(query, values);
    return results;
  },
  beginTransaction: async function () {
    const tran = new Transaction();
    await tran.begin();
    return tran;
  },
};

module.exports = {
  MYSQLClient,
  sql,
};
