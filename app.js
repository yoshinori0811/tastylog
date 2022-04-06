"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IS_PRODUCTION = process.env.NODE_ENV === "development";
const appconfig = require("./config/application.config");
const dbconfig = require("./config/mysql.config");
const path_1 = __importDefault(require("path"));
const logger_1 = require("./lib/log/logger");
const accesscontrol = require("./lib/security/accesscontrol");
const express_1 = __importDefault(require("express"));
const serve_favicon_1 = __importDefault(require("serve-favicon"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const connect_flash_1 = __importDefault(require("connect-flash"));
// expressのインスタンス化
const app = (0, express_1.default)();
// express setting
app.set("view engine", "ejs");
app.disable("x-powered-by");
app.use((req, res, next) => {
    res.locals.moment = require("moment");
    res.locals.padding = require("./lib/math/math").padding;
    next();
});
// static resource rooting
app.use((0, serve_favicon_1.default)(path_1.default.join(__dirname, "/public/favicon.ico")));
app.use("/public", express_1.default.static(path_1.default.join(__dirname, "/public")));
// set middleware
app.use((0, cookie_parser_1.default)());
app.use(session({
    store: new MySQLStore({
        host: dbconfig.HOST,
        port: dbconfig.PORT,
        user: dbconfig.USERNAME,
        password: dbconfig.PASSWORD,
        database: dbconfig.DATABASE,
    }),
    cookie: {
        secure: IS_PRODUCTION,
    },
    secret: appconfig.security.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    name: "sid",
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, connect_flash_1.default)());
app.use(...accesscontrol.initialize());
// Dynamic resource rooting
// トランザクション処理
app.use("/account", require("./routes/account"));
app.use("/search", require("./routes/search"));
app.use("/shops", require("./routes/shops"));
app.use("/", require("./routes/index"));
// custom error page
app.use((req, res, next) => {
    res.status(404);
    res.render("./404.ejs");
});
app.use((req, res, next) => {
    res.status(500);
    res.render("./500.ejs");
});
/**
 * listenメソッド
 * サーバーを立ち上げる関数
 * listen(ポート番号, コールバック関数)
 */
app.listen(appconfig.PORT, () => {
    logger_1.logger.info(`Application listening at ${appconfig.PORT}`);
});
