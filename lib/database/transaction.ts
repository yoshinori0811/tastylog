import * as pool from "./pool"
// let pool = require("./pool");

// コネクションを保持、管理する
const Transaction = class {
  connection;
  constructor(connection?: any) {
    this.connection = connection;
  }
  async begin() {
  //   if (this.connection) {
  //     this.connection.release();
  //   }
    this.connection = await pool.getConnection();
    this.connection.beginTransaction();
  }
  async executeQuery(query: string, values: any, options = {}) {
    options = {
      fields: options.fields || false,
    };
    return new Promise((resolve, reject) => {
      this.connection.query(query, values, (err, results, fields) => {
        if (!err) {
          resolve(!options.fields ? results : { results, fields });
        } else {
          reject(err);
        }
      });
    });
  }
  async commit() {
    return new Promise((resolve, reject) => {
      this.connection.commit((err) => {
        if (!err) {
          this.connection.release();
          this.connection = null;
          resolve("OK");
        } else {
          reject(err);
        }
      });
    });
  }
  async rollback() {
    return new Promise((resolve, reject) => {
      this.connection.rollback(() => {
        this.connection.release();
        this.connection = null;
        resolve("OK");
      });
    });
  }
};

module.exports = Transaction;
