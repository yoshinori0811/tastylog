"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.end = exports.releaseConnection = exports.executeQuery = exports.getConnection = exports.pool = void 0;
const mysql = __importStar(require("mysql2"));
const util = __importStar(require("util"));
const config = require("../../config/mysql.config");
exports.pool = mysql.createPool({
    host: config.HOST,
    port: config.PORT,
    user: config.USERNAME,
    password: config.PASSWORD,
    database: config.DATABASE,
    connectionLimit: config.CONNECTION_LIMIT,
    queueLimit: config.QUEUE_LIMIT,
});
exports.getConnection = util.promisify(exports.pool.getConnection).bind(exports.pool);
exports.executeQuery = util.promisify(exports.pool.query).bind(exports.pool);
const releaseConnection = function (connection) {
    connection.release();
};
exports.releaseConnection = releaseConnection;
exports.end = util.promisify(exports.pool.end).bind(exports.pool);
