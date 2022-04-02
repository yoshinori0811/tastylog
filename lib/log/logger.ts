import Log4js from "log4js";
Log4js.configure("log4js.config.json");
export const logger = Log4js.getLogger();
