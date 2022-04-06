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
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { MYSQLClient, sql } = require("../lib/database/client");
const moment_1 = __importDefault(require("moment"));
const csrf_1 = __importDefault(require("csrf"));
const tokens = new csrf_1.default();
const DATE_FORMAT = "YYYY/MM/DD";
let validateReviewData = (req) => {
    let body = req.body;
    let isValid = true, error = { visit: "訪問日の日付文字列が不正です。" };
    if (body.visit && !(0, moment_1.default)(body.visit, DATE_FORMAT).isValid()) {
        isValid = false;
        error.visit;
    }
    if (isValid) {
        return undefined;
    }
    return error;
};
let createReviewData = (req) => {
    let body = req.body;
    let date = req.body.date;
    return {
        shopId: req.params.shopId,
        score: parseFloat(body.score),
        visit: (date = (0, moment_1.default)(body.visit, DATE_FORMAT)) && date.isValid() ? date.toDate() : null,
        post: new Date(),
        description: body.description,
    };
};
router.get("/regist/:shopId(\\d+)", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let shopId = req.params.shopId;
    let shop, shopName, review, results;
    let token, secret;
    // 秘密鍵の生成
    secret = yield tokens.secret();
    // トークンの生成
    token = tokens.create(secret);
    //
    req.session._csrf = secret;
    res.cookie("_csrf", token);
    try {
        results = yield MYSQLClient.executeQuery(yield sql("SELECT_SHOP_BASIC_BY_ID"), [shopId]);
        shop = results[0] || {};
        shopName = shop.name;
        review = {};
        res.render("./account/reviews/regist-form.ejs", { shopId, shopName, review });
    }
    catch (err) {
        next(err);
    }
}));
router.post("/regist/:shopId(\\d+)", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let review = createReviewData(req);
    let { shopId, shopName } = req.body;
    res.render("./account/reviews/regist-form.ejs", { shopId, shopName, review });
}));
router.post("/regist/confirm", (req, res) => {
    let error = validateReviewData(req);
    let review = createReviewData(req);
    let { shopId, shopName } = req.body;
    if (error) {
        res.render("./account/reviews/regist-form.ejs", { error, shopId, shopName, review });
        return;
    }
    res.render("./account/reviews/regist-confirm.ejs", { shopId, shopName, review });
});
router.post("/regist/execute", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let secret = req.session._csrf;
    let token = req.cookies._csrf;
    if (tokens.verify(secret, token) === false) {
        next(new Error("Invalid Token."));
        return;
    }
    let error = validateReviewData(req);
    let review = createReviewData(req);
    let { shopId, shopName } = req.body;
    let userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    let transaction;
    if (error) {
        res.render("./account/reviews/regist-form.ejs", { error, shopId, shopName, review });
        return;
    }
    try {
        transaction = yield MYSQLClient.beginTransaction();
        transaction.executeQuery(yield sql("SELECT_SHOP_BY_ID_FOR_UPDATE"), [shopId]);
        transaction.executeQuery(yield sql("INSERT_SHOP_REVIEW"), [shopId, userId, review.score, review.visit, review.description]);
        transaction.executeQuery(yield sql("UPDATE_SHOP_SCORE_BY_ID"), [shopId, shopId]);
        yield transaction.commit();
    }
    catch (err) {
        yield transaction.rollback();
        next(err);
        return;
    }
    delete req.session._csrf;
    res.clearCookie("_csrf");
    res.redirect(`/account/reviews/regist/complete?shopId=${shopId}`);
    router.get("/regist/complete", (req, res) => {
        res.render("./account/reviews/regist-complete.ejs", { shopId: req.query.shopId });
    });
}));
module.exports = router;
