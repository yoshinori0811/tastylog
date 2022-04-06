const IS_PRODUCTION = process.env.NODE_ENV === "development";
const appconfig = require("./config/application.config");
const dbconfig = require("./config/mysql.config");
import path from "path";
import { logger } from "./lib/log/logger";
const accesscontrol = require("./lib/security/accesscontrol");
import express from "express";
import favicon from "serve-favicon";
import cookie from "cookie-parser";
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
import flash from "connect-flash";

// expressのインスタンス化
const app: express.Express = express();

// express setting
app.set("view engine", "ejs");
app.disable("x-powered-by");

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.locals.moment = require("moment");
  res.locals.padding = require("./lib/math/math").padding;
  next();
});

// static resource rooting
app.use(favicon(path.join(__dirname, "/public/favicon.ico")));
app.use("/public", express.static(path.join(__dirname, "/public")));

// set middleware
app.use(cookie());
app.use(
  session({
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
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(flash());
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
  res.render("./404.ejs")
})
app.use((req, res, next) => {
  res.status(500);
  res.render("./500.ejs")
})


/**
 * listenメソッド
 * サーバーを立ち上げる関数
 * listen(ポート番号, コールバック関数)
 */
app.listen(appconfig.PORT, () => {
  logger.info(`Application listening at ${appconfig.PORT}`);
});
