"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { ACCOUNT_LOCK_WINDOW, ACCOUNT_LOCK_THRESHOLD, ACCOUNT_LOCK_TIME, MAX_LOGIN_HISTORY } = require("../../config/application.config").security;
const moment_1 = __importDefault(require("moment"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_1 = __importDefault(require("passport"));
const LocalStrategy = require("passport-local").Strategy;
const { MYSQLClient, sql } = require("../database/client");
const PRIVILEGE = {
    NORMAL: "normal",
};
const LOGIN_STATUS = {
    SUCCESS: 0,
    FAILURE: 1,
};
let initialize, authenticate, authorize;
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
passport_1.default.use("local-strategy", new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    passReqToCallback: true,
}, (req, username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    let transaction, results, user, count;
    let now = new Date();
    try {
        transaction = yield MYSQLClient.beginTransaction();
        results = yield transaction.executeQuery(yield sql("SELECT_USER_BY_EMAIL_FOR_UPDATE"), [username]);
        if (results.length !== 1) {
            transaction.commit();
            return done(null, false, req.flash("message", "ユーザー名 または パスワードが間違っています"));
        }
        user = {
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            permissions: [PRIVILEGE.NORMAL],
        };
        if (results[0].locked && (0, moment_1.default)(now).isSameOrBefore((0, moment_1.default)(results[0].locked).add(ACCOUNT_LOCK_TIME, "minutes"))) {
            transaction.commit();
            return done(null, false, req.flash("message", "アカウントがロックされています"));
        }
        // delete old login history
        yield transaction.executeQuery(yield sql("DELETE_LOGIN_HISTORY"), [user.id, user.id, MAX_LOGIN_HISTORY - 1]);
        // compare password
        if (!(yield bcrypt_1.default.compare(password, results[0].password))) {
            // insert account, if need
            yield transaction.executeQuery(yield sql("INSERT_LOGIN_HISTORY"), [user.id, now, LOGIN_STATUS.FAILURE]);
            // lock account, if need
            let tmp = yield transaction.executeQuery(yield sql("COUNT_LOGIN_HISTORY"), [user.id, (0, moment_1.default)(now).subtract(ACCOUNT_LOCK_WINDOW, "minutes").toDate(), LOGIN_STATUS.FAILURE]);
            count = (tmp || [])[0].count;
            if (ACCOUNT_LOCK_THRESHOLD <= count) {
                yield transaction.executeQuery(yield sql("UPDATE_USER_LOCKED"), [now, user.id]);
            }
            transaction.commit();
            return done(null, false, req.flash("message", "ユーザー名 または パスワードが間違っています"));
        }
        // insert login log
        yield transaction.executeQuery(yield sql("INSERT_LOGIN_HISTORY"), [user.id, now, LOGIN_STATUS.SUCCESS]);
        // unlock account
        yield transaction.executeQuery(yield sql("UPDATE_USER_LOCKED"), [null, user.id]);
        transaction.commit();
    }
    catch (err) {
        transaction.rollback();
        return done(err);
    }
    // sesion 再生成
    req.session.regenerate((err) => {
        if (err) {
            done(err);
        }
        else {
            done(null, user);
        }
    });
})));
initialize = function () {
    return [
        passport_1.default.initialize(),
        passport_1.default.session(),
        function (req, res, next) {
            if (req.user) {
                res.locals.user = req.user;
            }
            next();
        },
    ];
};
authenticate = function () {
    return passport_1.default.authenticate("local-strategy", {
        successRedirect: "/account",
        failureRedirect: "/account/login",
    });
};
// 認可処理
authorize = function (privilege) {
    return function (req, res, next) {
        if (req.isAuthenticated() && (req.user.permissions || []).indexOf(privilege) >= 0) {
            next();
        }
        else {
            res.redirect("/account/login");
        }
    };
};
module.exports = {
    initialize,
    authenticate,
    authorize,
    PRIVILEGE,
};
