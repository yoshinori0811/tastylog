const { ACCOUNT_LOCK_WINDOW, ACCOUNT_LOCK_THRESHOLD, ACCOUNT_LOCK_TIME, MAX_LOGIN_HISTORY } = require("../../config/application.config").security;
import moment from "moment";
import bcrypt from "bcrypt";
import express from "express";
import passport from "passport";
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

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  "local-strategy",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req: express.Request, username: string, password: string, done) => {
      let transaction, results, user, count;
      let now = new Date();
      try {
        transaction = await MYSQLClient.beginTransaction();
        results = await transaction.executeQuery(await sql("SELECT_USER_BY_EMAIL_FOR_UPDATE"), [username]);

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

        if (results[0].locked && moment(now).isSameOrBefore(moment(results[0].locked).add(ACCOUNT_LOCK_TIME, "minutes"))) {
          transaction.commit();
          return done(null, false, req.flash("message", "アカウントがロックされています"));
        }

        // delete old login history
        await transaction.executeQuery(await sql("DELETE_LOGIN_HISTORY"), [user.id, user.id, MAX_LOGIN_HISTORY - 1]);

        // compare password
        if (!(await bcrypt.compare(password, results[0].password))) {
          // insert account, if need
          await transaction.executeQuery(await sql("INSERT_LOGIN_HISTORY"), [user.id, now, LOGIN_STATUS.FAILURE]);
          // lock account, if need
          let tmp = await transaction.executeQuery(await sql("COUNT_LOGIN_HISTORY"), [user.id, moment(now).subtract(ACCOUNT_LOCK_WINDOW, "minutes").toDate(), LOGIN_STATUS.FAILURE]);
          count = (tmp || [])[0].count;
          if (ACCOUNT_LOCK_THRESHOLD <= count) {
            await transaction.executeQuery(await sql("UPDATE_USER_LOCKED"), [now, user.id]);
          }
          transaction.commit();
          return done(null, false, req.flash("message", "ユーザー名 または パスワードが間違っています"));
        }
        // insert login log
        await transaction.executeQuery(await sql("INSERT_LOGIN_HISTORY"), [user.id, now, LOGIN_STATUS.SUCCESS]);
        // unlock account
        await transaction.executeQuery(await sql("UPDATE_USER_LOCKED"), [null, user.id]);
        transaction.commit();
      } catch (err) {
         transaction.rollback();
        return done(err);
      }
      // sesion 再生成
      req.session.regenerate((err) => {
        if (err) {
          done(err);
        } else {
          done(null, user);
        }
      });
    }
  )
);

initialize = function () {
  return [
    passport.initialize(),
    passport.session(),
    function (req: express.Request, res: express.Response, next: express.NextFunction) {
      if (req.user) {
        res.locals.user = req.user;
      }
      next();
    },
  ];
};

authenticate = function () {
  return passport.authenticate("local-strategy", {
    successRedirect: "/account",
    failureRedirect: "/account/login",
  });
};

// 認可処理
authorize = function (privilege: string) {
  return function (req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated() && (req.user.permissions || []).indexOf(privilege) >= 0) {
      next();
    } else {
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
